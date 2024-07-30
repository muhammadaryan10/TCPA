const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { RegisterUser, LoginUser , UserHistory , UploadFile, CheckFile, allHistory  } = require('../controllers/userControllers');
const userAuthenticate = require('../middlewares/userAuth');





const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './public/uploads'); // Destination directory for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Use original file name for the uploaded file
    }
  });

var upload = multer({ storage : storage})


router.route('/register').post(RegisterUser);
router.route('/login').post(LoginUser);
router.route('/uploadFile').post(upload.single('file'), UploadFile);  
router.post('/check', userAuthenticate, upload.single('file'), CheckFile);
// router.route('/order/:id').post(userAuthenticate, placeOrder);
// router.route('/logout').get(userAuth, logoutUser);
router.route('/history').get(userAuthenticate, UserHistory); // Assuming getAllHistories is a function in your controller
router.route('/allHistory').get(allHistory);
module.exports = router;