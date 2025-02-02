import React, { Component, Fragment } from 'react';
import openSocket from 'socket.io-client'
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';
import { query } from 'express';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `
        {
          user {
            status
          }
        }
      `
    }
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer '+this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.');
        }
        return res.json();
      })
      .then(resData => {
        if(resData.errors)
          throw new Error('fetch failed')
        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();
    // const socket = openSocket('http://localhost:8080')
    // socket.on('posts', data => {
    //   if(data.action === 'create')
    //     this.addPost(data.post)
    //   else if(data.action === 'update')
    //     this.updatedPosts(data.post)
    //   else if(data.action === 'delete')
    //       this.loadPosts()
    // })
  }
addPost = post => {
  this.setState(prevState => {
    const updatedPosts = [...prevState.posts]

    if(prevState.postPage === 1){
      updatedPosts.pop()
      updatedPosts.unshift(post)
    }
    return{
      posts: updatedPosts,
      totalPosts: prevState.totalPosts+1
    }
  })
}

updatedPosts = post => {
  this.setState(prevState => {
    const updatedPosts = [...prevState.posts]
    const updatedPostsIndex = updatedPosts.findIndex(p=>p._id === post._id)

    if(updatedPosts > -1)
      updatedPosts[updatedPostsIndex]=post
    return {
      posts: updatedPosts
    }
  })
}
  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    const graphqlQuery = {
      query: `
        query FetchPosts($pages: Int{
          posts(page: ${page}) {
            posts {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
            }
            totalPosts
          }
        }
      `, variables: {
        page: page
      }
    }
    // fetch('http://localhost:8080/feed/posts?page=' + page, {
    //   headers: {
    //     Authorization: 'Bearer '+this.props.token
    //   }
    // })
    fetch('http://localhost:8080/graphql' + page, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer '+this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        return res.json();
      })
      .then(resData => {
        if(resData.errors)
          throw new Error('fetch failed')
        this.setState({
          posts: resData.data.posts.posts.map(p => {
            return {
              ...p,
              imagePath: p.imageUrl
            }
          }),
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    const graphqlQuery = {
      query: `
        mutation UpdateUserStatus($userStatus: String!){
          updatedStatus(status: $usertatus }"){
            status
          }
        }
      `,
      variables: {
        userStatus: this.state.status
      }
    }
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer '+this.props.token,
        'Content-Type': 'application/json'
      }, body: JSON.stringify(graphqlQuery)

    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        if(resData.errors)
          throw new Error('Status failed')
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // Set up data (with image!)
    const formData = new FormData()

    // formData.append('title', postData.title)
    // formData.append('content', postData.content)
    formData.append('image', postData.image)
    if(this.state.editPost)
      formData.append('oldPath', this.state.editPost.imagePath)
    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer '+this.props.token
      }, body: formData
    }).then(r=>r.json()).then(r=> {
      const imageUrl= r.filePath || 'undefined'
      let graphqlQuery = {
        query: `
          mutation {
            createPost(postInput: {title: "${postData.title}", content: "${postData.content}", imageUrl: "${imageUrl}"}) {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
          }
        `
      }
      
      if(this.state.editPost)
        graphqlQuery = {
          query: `
            mutation {
              updatePost(id: "${this.state.editPost._id}", postInput: {title: "${postData.title}", content: "${postData.content}", imageUrl: "${imageUrl}"}) {
                _id
                title
                content
                imageUrl
                creator {
                  name
                }
                createdAt
              }
            }
          `
        }

      // let url = 'http://localhost:8080/feed/post';
      // let method = 'POST'
      // if (this.state.editPost) {
      //   url = 'http://localhost:8080/feed/post/' + this.state.editPost._id
      //   method = 'PUT'
      // }
  
      // fetch(url, {
      //   method: method,
      //   body: formData,
      //   headers: {
      //     Authorization: 'Bearer '+this.props.token
      //   }
      // })
        return fetch('http://localhosy:8080/graphql', {
          method: "POST",
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: 'Bearer '+this.props.token,
            'Content-Type': 'application/json'
          }
        })
    })
    

      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        if(resData.errors && resData.errors[0].status === 422)
          throw new Error('Validation failed')
        if(resData.errors)
          throw new Error('User login failed')
        let resDatafiled = 'createdPost'
        if(this.state.editPost)
          resDatafiled = 'updatedPost'
        const post = {
          _id: resData.data[resDatafiled]._id,
          title: resData.data[resDatafiled].title,
          content: resData.data[resDatafiled].content,
          creator: resData.data[resDatafiled].creator,
          createdAt: resData.data[resDatafiled].createdAt,
          imagePath: resData.data[resDatafiled].imageUrl
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState]
          let updatedTotalPosts = prevState.totalPosts

          if(prevState.editPost){
            const postIndex = prevState.posts.findIndex(p => p._id === prevState.editPost._id)
            updatedPosts[postIndex]=post
          }
          else{
            updatedTotalPosts++
            if(prevState.posts.length >= 2)
              updatedPosts.pop()
            updatedPosts.unshift(post)
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false,
            totalPosts: updatedTotalPosts
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    const graphqlQuery = {
      query: `{
        mutation {
          deletePost(id: "${postId}")
        }
      }`
    }
    // fetch('http://localhost:8080/feed/post' + postId, {
    //   method: 'DELETE',
    //   headers: {
    //     Authorization: 'Bearer '+this.props.token
    //   }
    // })
        fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer '+this.props.token,
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        if(resData.errors)
          throw new Error('Delect error')
        console.log(resData);
        this.loadPosts()
        // this.setState(prevState => {
        //   const updatedPosts = prevState.posts.filter(p => p._id !== postId);
        //   return { posts: updatedPosts, postsLoading: false };
        // });
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
