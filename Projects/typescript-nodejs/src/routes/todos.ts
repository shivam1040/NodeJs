import {Router} from 'express'
import { Todo } from '../models/todo'

const router = Router()
let todos: Todo[] = []
type RequestBody = { text: string}

router.get('/', (req, res, next) => {
    res.json({todos: todos})
})

router.post('/todo', (req, res, next) => {
    const body = req.body as RequestBody
    const newTodo: Todo = {
     id: new Date().toISOString(),
     text: body.text  
    }
    
    todos.push(newTodo)
    res.json({message: 'added todo'})
})

router.put('/todo/:todoId', (req, res, next) => {
    const tid = req.params.todoId
    const body = req.body as RequestBody
    const todoIndex = todos.findIndex(todoItem => todoItem.id === tid)
    if(todoIndex>=0){
        todos[todoIndex] = {id: todos[todoIndex].id, text: body.text}
        res.json({message: 'updated', todos: todos})
      
}
else
res.status(404).json({message: 'no id'})
})

router.delete('/todo/:todoId', (req, res, next) => {
    todos = todos.filter(t => t.id !== req.params.todoId)

    res.json({message: 'deleted', todos: todos})
})

export default router