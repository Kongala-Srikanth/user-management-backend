const {MongoClient} = require('mongodb')
const {v4:uuidv4} = require('uuid')
const cors = require('cors')
const express = require('express')
require('dotenv').config();

const app = express()
app.use(express.json())
app.use(cors())

let client 
const setupDBandServer = async () => {
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbCluster = process.env.DB_CLUSTER;
    const dbName = process.env.DB_NAME;
    const url = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}/${dbName}?retryWrites=true&w=majority`;    
    client = new MongoClient(url)

    try{
        await client.connect()
        console.log('Successfully Connected to MongoDB')

        const port = 3000
        app.listen(port, () => {
            console.log('Server Running at Port', port)
        })
    }catch (e) {
        console.log(`Error while connecting to MongoDB: ${e.message}`)
    }
}



// API-1 Add user details

app.post('/users', async (request, response) => {
    const {firstName,lastName, email, department} = request.body
    const tableData = client.db(process.env.DB_NAME).collection('userDetails')

    const checkUserInDB = await tableData.find({email}).toArray()

    if (checkUserInDB.length < 1){
        const userDetails = {
            userId: uuidv4(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            department: department
        }
        
        await tableData.insertOne(userDetails)
        response.status(201).send({successMsg: "User Added Successfully"})
        
    }else{
        response.status(401)
        response.send({errorMsg: "User Already Exist"})
    }
})



// API-1 Update user details

app.put('/user/:id', async (request, response) => {
    const {id} = request.params
    const {firstName, lastName, email, department} = request.body
    const tableData = client.db(process.env.DB_NAME).collection('userDetails') 
    const updateFields = {};

    try{
        if(firstName){
            updateFields.firstName = firstName
        }
    
        if(lastName){
            updateFields.lastName = lastName
        }
    
        if(email){
            updateFields.email = email

        }if(department){
            updateFields.department = department
        }

        if (Object.keys(updateFields).length === 0) {
            return response.status(400).send({ errorMsg: "No fields provided to update" });
        }

        

        const result = await tableData.updateOne(
            { userId: id },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return response.status(404).send({ errorMsg: "User not found" });
        }

        response.status(200).send({ successMsg: "User updated successfully" });
    } catch (error) {
        console.error("Update error:", error);
        response.status(500).send({ errorMsg: "Failed to update user data" });
    }
})




// API-1 Delete user details

app.delete('/user/:id', async (request, response) => {
    const { id } = request.params; 
    const tableData = client.db(process.env.DB_NAME).collection('userDetails');

    try {
        const result = await tableData.deleteOne({
            userId: id, 
        });

        if (result.deletedCount === 0) {
            return response.status(404).json({ errorMsg: 'User not found' });
        }

       
        response.status(200).json({ successMsg: 'User Details deleted successfully' });
    } catch (error) {
        response.status(500).json({ errorMsg: 'Error', error: error.message });
    }
})



// API-1 Get all user details

app.get('/users', async (request, response) => {
    const tableData = client.db(process.env.DB_NAME).collection('userDetails');

    try{
        const data = await tableData.find().toArray()
        response.status(200).json(data)

    }catch (e){
        console.log('Error fetching all user details:', e)
        response.status(500).json({errorMsg: 'Failed to fetch user details', error: e.message})
    }

})




setupDBandServer()
