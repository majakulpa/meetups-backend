const app = require('./app')
const http = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')

const server = http.createServer(app)
const myPORT = process.env.PORT || config.PORT
server.listen(myPORT, () => {
  logger.info(`Server is running on port ${myPORT}`)
})
