// const { json } = require("express");
const express = require("express");
const User = require("../models/userModel");
const Number = require('../models/numbersModel')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');
const history = require("../models/historyModel");


// const csv = require('fast-csv');

const RegisterUser = async (req, res) => {
    const { name, email, phone, password } = req.body;
    console.log(req.body);
    if (
        name.length == 0 ||
        phone.length == 0 ||
        email.length == 0 ||
        password.length == 0
    ) {
        console.log("fields cannot be left emoty");
        return res.status(403).json({ message: "fields cannot be left emoty" });
    }
    try {
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            console.log("user already registered");
            return res
                .status(422)
                .json({ message: "User already exist with this email" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: "User regsitered " });
    } catch (error) {
        res.send(error);
        console.log(error);
    }
};

const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const userLogin = await User.findOne({ email: email });
        if (userLogin) {
            const passMatch = await bcrypt.compare(password, userLogin.password);
            // passMatch = true or false ;
            console.log(`passwordMatch = ${passMatch}`);
            if (passMatch) {
                console.log(`Password Match is  : ${passMatch}`);
                const token = await userLogin.generateAuthToken();
                const verifyToken = jwt.verify(token, process.env.SECRETKEY);
                console.log(verifyToken);
                res.status(201).json({ message: "User Logged In", token });
            } else {
                return res.status(422).json({ message: "Please Enter Correct Password " });
            }
        } else {
            return res.status(420).json({ message: "Please Enter valid Email" });
        }
    } catch (error) {
        res.send(`error : ${error}`);
    }
};

const UploadFile = async (req, res) => {
    try {
        console.log('Starting file upload...');

        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const results = [];
        const batchSize = 1000; // Adjust the batch size according to your needs

        const processBatch = async (batch) => {
            try {
                await Number.insertMany(batch);
            } catch (error) {
                console.error('Error inserting data:', error);
            }
        };

        const processFile = () => {
            return new Promise((resolve, reject) => {
                let batch = [];

                fs.createReadStream(filePath)
                    .pipe(csv({ headers: true }))
                    .on('headers', (headers) => {
                        console.log('CSV Headers:', headers);
                    })
                    .on('data', (data) => {
                        const mappedData = {
                            number: data.Number || data._0,
                            status: "Troll",
                            caseTitle: "Yes",
                            multipleCases: "Yes",
                            phoneType: "Landline"
                        };
                        results.push(mappedData);

                        batch.push(mappedData);
                        if (batch.length >= batchSize) {
                            processBatch(batch);
                            batch = [];
                        }
                    })
                    .on('end', async () => {
                        if (batch.length > 0) {
                            await processBatch(batch);
                        }
                        resolve();
                    })
                    .on('error', (error) => {
                        console.error('Error reading file:', error);
                        reject(error);
                    });
            });
        };

        await processFile();

        if (results.length > 0) {
            res.status(201).send({ message: 'File processed successfully', data: results });
        } else {
            res.status(400).send({ message: 'No valid data found in the file' });
        }

        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ message: error.message });
    }
};

const CheckFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const numbersInFile = new Set();
        const userId = req.userID;
        console.log(userId)
        const matchedNumbers = [];
        const unmatchedNumbers = [];
        let totalNumbersCount = 0;
        const fileName = req.file.originalname;

        const readFile = () => {
            return new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv({ headers: true }))
                    .on('data', (data) => {
                        const number = data.Number || data._0;
                        totalNumbersCount++
                        numbersInFile.add(number);
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            });
        };

        await readFile();

        const numbersArray = Array.from(numbersInFile);
        const dbNumbers = await Number.find({ number: { $in: numbersArray } });

        const dbNumbersSet = new Set(dbNumbers.map((doc) => doc.number));

        numbersInFile.forEach((number) => {
            if (dbNumbersSet.has(number)) {
                matchedNumbers.push(number);
            } else {
                unmatchedNumbers.push(number);
            }
        });

        const numbersHistoryEntry = new history({
            goodNumbers: unmatchedNumbers,
            badNumbers: matchedNumbers,
            goodNo: unmatchedNumbers.length,
            badNo: matchedNumbers.length,
            totalNumbersCount,
            fileName,
            userId
        });

        await numbersHistoryEntry.save()

        res.status(200).send({
            matchedNumbers,
            unmatchedNumbers,
            totalNumbersCount
        });

        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send({ message: error.message });
    }
}

const UserHistory = async (req, res) => {
    try {
        const userId = req.userID;
        console.log(userId)
        const histories = await history.find({ userId: userId });
        res.json(histories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching histories' });
    }
}

const allHistory = async (req, res) => {
    try {
        const histories = await history.find();
        res.json(histories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching histories' });
    }
}


// const placeOrder = async (req, res) => {
//   const { CustomerAddress,Price , CustomerPhone,CustomerName,CustomerEmail} = req.body;
//   const   VendorId = req.params.id;
//   console.log(req.body );
//   console.log(VendorId)
//   if (
//     CustomerAddress.length == 0 ||
//     Price.length == 0 ||
//     CustomerPhone.length == 0 ||
//     CustomerName.length == 0 ||
//     CustomerEmail.length == 0 
//   ) {
//     console.log("fields cannot be left emoty");
//     return res.status(204).json({ message: "fields cannot be left emoty" });
//   }
//   try {
//     const vender=await Vender.findById(VendorId)
//     if (!vender) {
//       console.log("Vendor not found");
//       return res.status(404).json({ message: "Vendor not found" });
//     }
//     const order = new Order({
//       userid:req.rootUser._id,
//       CustomerEmail:CustomerEmail,
//       CustomerPhone:CustomerPhone,
//       Price:Price,
//       VenderEmail:vender.email,
//       VendorId:VendorId,
//       CustomerAddress:CustomerAddress,
//       CustomerName:CustomerName
//     });
//     await order.save();
//     notifyVendor(order)
//     res.status(201).json({ message: "Order Placed " });
//   } catch (error) {
//     res.send(error);
//     console.log(error);
//   }
// };

//  Send Mail to the User 
// const notifyVendor = async (order) => {
//   try {
//     console.log(order.VenderEmail)
//    await sendEmail({
//       VenderEmail: order.VenderEmail, 
//       subject: 'New Order Notification',
//       message:"You have an New order",
//       // html: `
//       //   <p>Hello Vendor,</p>
//       //   <p>A new order has been placed:</p>
//       //   <ul>
//       //     <li>Order ID: ${order._id}</li>
//       //     <li>Customer Name: ${order.CustomerName}</li>
//       //     <li>Customer Email: ${order.CustomerEmail}</li>
//       //     <li>Customer Phone: ${order.CustomerPhone}</li>
//       //     <li>Price: ${order.Price}</li>
//       //     <li>Customer Address: ${order.CustomerAddress}</li>
//       //   </ul>
//       //   <p>Thank you!</p>
//       // `,
//     });
//    res.status(201).json({message:"Email has been sent succsesfully"})
//     console.log('Vendor notified via email:', result);
//   } catch (error) {
//     console.error('Error notifying vendor via email:', error);
//   }
// }

module.exports = {
    RegisterUser,
    LoginUser,
    UploadFile,
    CheckFile,
    UserHistory,
    allHistory
};