const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const connect = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running...')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

connect()

const convertPlayerDetails = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetails = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

// API : 1

app.get('/players/', async (request, response) => {
  const quiry = `SELECT * FROM player_details;`
  const result = await db.all(quiry)
  response.send(result.map(each => convertPlayerDetails(each)))
})

// API : 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const quiry = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const result = await db.get(quiry)
  response.send(convertPlayerDetails(result))
})

// API : 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const quiry = `UPDATE player_details SET 
        player_name = "${playerName}"
        WHERE player_id = ${playerId};`
  await db.run(quiry)
  response.send('Player Details Updated')
})

// API : 4

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const quiry = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const result = await db.get(quiry)
  response.send(convertMatchDetails(result))
})

// API : 5

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const quiry = `
        SELECT * FROM 
        match_details NATURAL JOIN player_match_score 
        WHERE player_id = ${playerId};`
  const result = await db.all(quiry)
  response.send(result.map(each => convertMatchDetails(each)))
})

// API : 6

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const quiry = ` SELECT * FROM player_details NATURAL JOIN player_match_score
        
        WHERE match_id = ${matchId};`

  const result = await db.all(quiry)
  response.send(result.map(each => convertPlayerDetails(each)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const quiry = `
    SELECT player_id AS playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM player_details NATURAL JOIN player_match_score 
    
    WHERE player_id = ${playerId}`

  const result = await db.get(quiry)
  response.send(result)
})

module.exports = app
