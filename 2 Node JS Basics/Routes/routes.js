const fs = require("fs")

const requestHandler = (req, res) => {
    const url = req.url
    const method = req.method

    if(url==="/"){
        res.setHeader("Content-Type", "text/html")
        res.write("<body><form action='/message' method='POST'><input type='text' name='message'><button type='submit'>Send</button></form></body>")
        //this return ensures common loc isn't executed
        return res.end()
    }
    if(url==="/message" && method==="POST"){
        const body = []
        //event listener to push stream of request body in var
        //these listeners are async
        req.on("data", (c)=>{
            body.push(c)
        })
        //event listener to parse the stream when data stream has ended
        // and also sent finally at end of request parsing
        req.on("end", ()=>{
            const parsedBody = Buffer.concat(body).toString()
            fs.writeFileSync("a.txt", parsedBody.split("=")[1])
            //async version
            fs.writeFile("a.txt", parsedBody.split("=")[1], e=>{
                res.statusCode=302
                //way to redirect on status 302
                res.setHeader("Location", "/")
                return res.end()
            })
        })
    }
    res.setHeader("Content-Type", "text/html")
    res.write("<body>a</body>")
    return res.end()
}
//way to create custom node js module, this exports can also take multi property json
module.exports = requestHandler