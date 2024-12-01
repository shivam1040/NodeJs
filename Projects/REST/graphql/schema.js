const {buildSchema} = require('graphql')
//this means defining a schema which has query of type rootquery which gets resolved by hello of type TestData object ! means data can't be nullable
module.exports = buildSchema(`
    input UserInputData{
        email: String!
        name: String!
        password: String!
    }
    
    input PostInputData {
      title: String!
      content: String!
      imageUrl: String!  
    }

    type TestData {
        text: String!
        views: Int!
    }

    type RootQuery{
        hello: TestData!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }
    
    type RootQuery1{
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        posts: [Post!]!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(id: ID!, postInput: PostInputData!): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    schema {
        query: RootQuery1
        mutation: RootMutation
    }
    `)
//so to get this data make a post call to graphql endpoint with body '{ "query": "{ hello {text views} }"}'
//above will return { "data" : {"hello" : {"text" : "h", "views": 1}}} as response
//request to get mutation, { "mutation" {createUser(userInput: {email: "a", name: "1", pass: "3"}) { _id email}}}