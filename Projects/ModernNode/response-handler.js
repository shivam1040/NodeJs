import { readFile } from 'fs/promises';
import path from 'path'
import {fileURLToPath} from 'url'
import {dirname} from 'path'

const __fileName = fileURLToPath(import.meta.url)
const __dirname = dirname(__fileName)

export const resHandler = (_req, res, _next) => {
    readFile('my-page.html', 'utf-8', (_err, data) => {
        res.send(data)
    })
    res.sendFile(path.join(__dirname, 'my-page.html'))
}

//export default resHandler