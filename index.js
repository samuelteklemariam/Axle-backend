const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://sam_ltm:0904176498SSLLTT@cluster0.7pealgq.mongodb.net/ecommerce")

// API Creation
app.get("/", (req, res) => {
    res.send("Express App is Running")
})

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })

// Creating one endpoint for uploading images
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    avilable: { // Corrected misspelling from "avilable" to "available"
        type: Boolean,
        default: true,
    },
})

app.post('/addproduct', async (req, res) => {
    // Assign default values if fields are empty
    const product = new Product({
        id: req.body.id || 1, // Default id to 1 if not provided
        name: req.body.name || "default", // Default name to "default" if not provided
        image: req.body.image || "default", // Default image to "default" if not provided
        category: req.body.category || "default", // Default category to "default" if not provided
        new_price: req.body.new_price || 0, // Default new_price to 0 if not provided
        old_price: req.body.old_price || 0, // Default old_price to 0 if not provided
    });

    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})

// Creating API for deleting product
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})

// Creating API for getting all products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

// Schema creating for user model

const Users = mongoose.model('Users' ,{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        Default:Date.now,
    },
})

// Creating endpoint for registering a user
    app.post('/signup',async (req,res)=>{

        let check = await Users.findOne({email:req.body.email});
        if (check) {
            return res.status(400).json({success:false,errors:"existing user found with same email address"})
        }
        let cart = {};
        for (let i = 0; i < 300; i++){
            cart[i]=0;
        }
        const user = new Users({
            name:req.body.username,
            email:req.body.email,
            password:req.body.password,
            cartData:cart,
        })

        await user.save();

        const data = {
            
            user:{
                id:user.id
            }
        }

        const token = jwt.sign(data,'secret_ecom');
        res.json({success:true,token})

    })

// Creating endpoint for user login

app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if (user) 
    {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email Id"});
    }
})

// creating endpoint for newcollection data
app.get('/newcollection',async (req,res)=>{
    let products = await Product.find({});
    //slicing the all products to get the recently added 8 array
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
 })

 // creating endpoint for popular_in_women section
 app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:"Longboard"})
    let popular_in_women = products.slice(0,4);
    console.log("Latest resleases fetched");
    res.send(popular_in_women);
 })

// creating middleware to fetch user
const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenticate using valid token"})
        }
    }
}

// creating endpoint for saving cart data in mongobd database
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log(req.body,req.user);
})

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port)
    } else {
        console.log("Error : " + error)
    }
})
