const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//register post api

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const userQuery = `SELECT * FROM user WHERE username='${username}';`

  const dbUser = await db.get(userQuery)

  if (dbUser !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const addUserQuery = `
      UPDATE INTO
         user(username,name,password,gender,location)
      VALUES
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}';`
      await db.run(addUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

// login user api

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `SELECT * FROM user WHERE username='${username}';`

  const dbUser = await db.get(userQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password)

    if (isPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//update password api

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(userQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPassword === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      if (password.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updatedQuery = `
             UPDATE 
               user
             SET
               passwoord='${hashedPassword}'
             WHERE username=${username};`

        await db.run(updatedQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
