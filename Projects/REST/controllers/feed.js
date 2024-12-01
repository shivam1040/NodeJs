const {validationResult} = require('express-validator')
const Post = require('../models/post')
const fs = require('fs')
const path = require('path')
const User = require('../models/user')
const user = require('../models/user')
const io = require('../socket')

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2
    try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage -1) * perPage)
        .limit(perPage)
        res.json({message: 'Fetched', posts: posts, totalItems: totalItems})
    }
    catch(e){
        if(!e.statusCode)
            e.statusCode = 500
        next(err)   
    }
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('Errooorr')
        error.statusCode = 422
        
        throw error
    }
    if(!req.file){
        const error = new Error('no imagee')
        error.statusCode = 422

        throw error
    }
    const image = req.file.path
    const title = req.body.title
    const content = req.body.content
    const post = new Post({
        title: title, 
        content: content, 
        imageUrl: 'images/duck.png',
        creator: req.userId
    })
    let creator

    post.save().then(r => {
        return User.findById(req.userId)
    })
    .then(r => {
        creator = r

        r.post.push(post)
        return r.save()
    })
    .then(r => {
        io.getIo().emit('posts', {action: 'create', post: {...post._doc, creator: {_id: req.userId, name: creator.name}}})
        res.status(201).json({
            message: "Posted",
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name
            }
        })
    })
    .catch(e => {
        if(!e.statusCode)
                e.statusCode = 500
        next(err)
    })
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId).then(r => {
        if(!r){
            const error = new Error('No post')
            error.statusCode = 404

            throw error
        }
        res.json({message: 'Fetched', post: r})
    }).catch(e => {
        if(!e.statusCode)
            e.statusCode = 500
        next(err)
    })
}

exports.updatePost = (req, res, next) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('Errooorr')
        error.statusCode = 422
        
        throw error
    }
    const postId = req.params.postId
    const title = req.body.title
    const content = req.body.content
    let imageUrl = req.body.image

    if(!req.file)
            imageUrl =req.file.path
    if(!imageUrl){
        const error = new Error('No filee')
        error.statusCode = 422

        throw error
    }
    Post.findById(postId).then(r => {
        if(!r){
            const error = new Error('No post')
            error.statusCode = 404

            throw error
        }
        if(r.creator._id.toString() !== req.userId){
            const error = new Error('Unauth')
            error.statusCode = 403

            throw error
        }
        if(imageUrl !== r.imageUrl)
            clearImage(r.imageUrl)
        r.title = title
        r.imageUrl = imageUrl
        r.content = content

        return r.save()
    }).then(r => {
        io.getIo().emit('posts', {action: 'update', post: r})
        res.json({message: 'Updated', post: r})
    })
    .catch(e => {
        if(!e.statusCode)
            e.statusCode = 500
        next(err)
    })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId

    Post.findById(postId).then(r => {
        if(!r){
            const error = new Error('No post')
            error.statusCode = 404

            throw error
        }
        if(r.creator.toString() !== req.userId){
            const error = new Error('Unauth')
            error.statusCode = 403

            throw error
        }
        clearImage(r.imageUrl)
        return Post.findByIdAndDelete(postId)
    }).then(r => {
        return User.findById(req.userId)
})
.then(r => {
    r.post.pull(postId)
    return r.save()
})
.then(r =>  {
    io.getIo().emit('posts', {action: 'delete', post: postId})
    res.json({message: 'Deleted'})
})
    .catch(e => {
        if(!e.statusCode)
            e.statusCode = 500
        next(err)
    })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)

    fs.unlink(filePath, e => console.log(e))
}
