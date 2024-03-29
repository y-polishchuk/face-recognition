import React, { Component } from "react";
import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import Rank from "./components/Rank/Rank";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import SignIn from "./components/SignIn/SignIn";
import Register from "./components/Register/Register";
import ParticlesBg from 'particles-bg';
import './App.css';

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
};

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.loadUser(JSON.parse(storedUser));
      this.onRouteChange('home');
    } else {
      fetch('http://localhost:3000/session-status', {credentials: "include"})
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          this.loadUser(data.user);
          this.onRouteChange('home');
        }
      })
      .catch(err => console.log(err));
    }
  }

  loadUser = (data) => {
    this.setState({
      isSignedIn: true,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })

    localStorage.setItem('user', JSON.stringify(data));
  }

  calculateFaceLocation = (data) => {
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    const regions = data.outputs[0].data.regions;
    const faces = [];

    regions.forEach(region => {
      const clarifaiFace = region.region_info.bounding_box;
      faces.push({
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
      });
    })
    return faces;
  }

  displayFaceBox = (boxes) => {
    this.setState({boxes: boxes});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input})
    
    fetch('http://localhost:3000/imageurl', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      credentials: "include",
      body: JSON.stringify({
        input: this.state.input
      })
    })
    .then(response => response.json())
    .then(response => {
    if(response) {
      fetch('http://localhost:3000/image', {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        credentials: "include",
        body: JSON.stringify({
          id: this.state.user.id
        })
      })
      .then(response => response.json())
      .then(count => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {
          ...storedUser,
          entries: count
        };
        localStorage.setItem('user', JSON.stringify(updatedUser)); // write down updated user to the local storage

        this.setState(Object.assign(this.state.user, { entries: count }));
      })
      .catch(console.log);
    }
    this.displayFaceBox(this.calculateFaceLocation(response));
  })
  .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      localStorage.removeItem('user');
      fetch('http://localhost:3000/signout', {
        method: 'get',
        headers: {'Content-Type': 'application/json'},
        credentials: "include"
      })
      .then(response => response.json())
      .then(data => console.log(data.message));
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({isSignedIn: true});
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, user } = this.state;
    return (
      <div className="App">
        <ParticlesBg className="particles-bg-canvas-self" type="circle" />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home' && isSignedIn
          ? <div>
              <Logo />
              <Rank name={user.name} entries={user.entries} />
              <ImageLinkForm 
                onInputChange={this.onInputChange} 
                onButtonSubmit={this.onButtonSubmit} 
              />
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
            route === 'register'
            ? <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            )
        }
        
      </div>
    );
  }
}

export default App;
