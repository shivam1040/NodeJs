import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';
import image from '../../../components/Image/Image';
import { query } from 'express';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const query = {
      query: `{
        postId: "${postId}"{
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
    fetch('http://localhost:8080/graphql', {
      method: "POST",
      body: JSON.stringify(query),
      headers: {
        Authorization: 'Bearer '+this.props.token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch status');
        }
        return res.json();
      })
      .then(resData => {
        if(resData.errors)
          throw new Error('Login errur')
        this.setState({
          title: resData.data.post.title,
          author: resData.data.post.creator.name,
          image: 'http://localhost:8080/' + resData.data.post.imageUrl,
          date: new Date(resData.data.post.createdAt).toLocaleDateString('en-US'),
          content: resData.data.post.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
