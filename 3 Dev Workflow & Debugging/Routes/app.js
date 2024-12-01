//way to import file in node js
const http = require("http")
//importing module which isn't global
const routes = require('./routes')

const server = http.createServer(routes)

server.listen(3000)

//even though single thread the server func is scoped individually to each req/res so no concerns for data overlap/security