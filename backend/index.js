const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path'); // Require the path module

const cors = require('cors');
// const cookieParser = require('cookie-parser');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, // Allow credentials (cookies, authorization headers)
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname,'public')));
// app.use(cookieParser());



const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');

mongoose.connect('mongodb+srv://expertcodecraft:RV6y6B5TDHMAhNGw@litigator.a7xczci.mongodb.net/?retryWrites=true&w=majority&appName=Litigator')
  .then(() => {
    console.log('Db Connected');
  })
  .catch((err) => console.log('Error:', err));

  app.get('/app', (req,res) => {
    res.json({msg:"Running"});
})

app.listen(8000);

app.use('/api/user', userRoutes);
// app.use('/api/vender', venderRoutes);
// app.use('/api/admin', adminRoutes);