import React, {Component} from 'react';
import firebase from './firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import swal from 'sweetalert';
import cloudImg from './assets/dreamShareAkatsukiCloud.png' // relative path to image 
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      dreams: [],
      userInput: '',
      inputTitle: '',
      inputComment: '',
      limit: 7,
    }
  }

  componentDidMount() {
    // pull data from firebase to display
    const dbRef = firebase.database().ref();

    dbRef.on('value', (snapshot) => {

      const data = snapshot.val();

      const newDreamsArray = [];

      for (let key in data) {
        newDreamsArray.push({
          key: key,
          data: data[key]
        });
      }

      this.setState({
        dreams: newDreamsArray
      })
    })

    window.addEventListener('load', this.handleLoad);
  }

  componentWillUnmount() { 
    window.removeEventListener('load', this.handleLoad)  
  }

  handleLoad() {
    const loader = document.getElementsByClassName('preloader');
    loader[0].classList.toggle("loaded");
   }

  // dream content event listener
  handleChange = (event) => {
    this.setState({
      userInput: event.target.value
    })
  }

  // title event listener
  handleTitle = (event) => {
    this.setState({
      inputTitle: event.target.value
    })
  }

  // push dream input data to firebase
  handleClick= (event) => {
    event.preventDefault();

    const dbRef = firebase.database().ref();

    if (this.state.userInput !== "" && this.state.inputTitle !== "") {
      // push dream object to firebase
      const dreamObjectTwo = {
        dream: this.state.userInput,
        title: this.state.inputTitle,
        vote: 0,
        comments: ['']
      }

      // push dream to db AND set local storage item as dream entry author
      const key = dbRef.push(dreamObjectTwo).key;
      this.setStorage(`${key}author`, 'yes');

      // reset error handling
      this.setState({
        errorMessage: '',
      })

      window.location = "#addedDream";
    } else {
      // error handling
      swal({
        text: "Please give your entry a title and content before submitting",
        icon: "warning",
        button: "OK",
      });
    }

    // clear input text
    this.setState({
      inputTitle: '',
      userInput: ''
    })
  }

  // upvote selected dream
  handleVote = (voteId) => {
    const localStorageItem = window.localStorage.getItem(`${voteId}liked`);
    if (localStorageItem) {
      const dbRef = firebase.database().ref(`/${voteId}`);
  
      dbRef.once('value', (snapshot) => {
        const newValue = snapshot.val();
        newValue.vote--;
  
        dbRef.set(newValue);
        // remove from local storage
        window.localStorage.removeItem(`${voteId}liked`, 'yes');
        // change styling
        document.getElementsByClassName(`vote${voteId}`)[0].classList.remove("liked");
      })
    } else {
      const dbRef = firebase.database().ref(`/${voteId}`);
  
      dbRef.once('value', (snapshot) => {
        const newValue = snapshot.val();
        newValue.vote++;
  
        dbRef.set(newValue);
        this.setStorage(`${voteId}liked`, 'yes');
      }) 
    }
  }

  // comment event listener
  handleComment = (event) => {
    this.setState({
      inputComment: event.target.value
    })
  }

  // show add comment option
  handleShowAddComment = (key) => {
    document.getElementsByClassName(`${key}input`)[0].classList.toggle("show");
  }

  // add comment to a dream
  handleAddComment = (key) => {
    const dbRef = firebase.database().ref(`/${key}`);

    if (this.state.inputComment !== "") {
      dbRef.once('value', (snapshot) => {
        const newValue = snapshot.val();
        newValue.comments.push(this.state.inputComment);
        dbRef.set(newValue);
        const commentIndex = newValue.comments.length - 1;
        this.setStorage(`${key}${commentIndex}`, 'yes');
      }) 

      // hide comment input
      setTimeout(() => {
        document.getElementsByClassName(`${key}input`)[0].classList.remove("show");
      }, 0)
    } else {
      swal({
        text: "Sorry, can't submit an empty comment",
        button: "OK",
      });
    }

    // clear input value
    document.querySelector(`.dream${key} .commentSectionInput`).value = '';
    this.setState({
      inputComment: ''
    })
  }

  // delete a dream
  handleRemove = (dreamId) => {
    const localStorageItem = window.localStorage.getItem(`${dreamId}author`);
    if (localStorageItem) {
      swal({
        title: "Are you sure?",
        text: "Once deleted, you'll lose this dream forever",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
          swal("Your Dream has been deleted!", {
            icon: "success",
          });
          const dbRef = firebase.database().ref();
  
          dbRef.child(dreamId).remove();
        } else {
          swal("Your Dream is safe!");
        }
      });
    } else {
      swal({
        text: "Trying to delete someone else's dream?",
        icon: "warning",
        button: "My Bad",
      });
    }
  }

  handleRemoveComment = (dreamId, i) => {
    const localStorageItem = window.localStorage.getItem(`${dreamId}${i + 1}`);
    if (localStorageItem) {
      swal({
        title: "Are you sure?",
        text: "Once deleted, you'll lose this comment forever",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
          swal("Your comment has been deleted!", {
            icon: "success",
          });
          const dbRef = firebase.database().ref();
  
          dbRef.child(`${dreamId}/comments/${i + 1}`).remove();
          window.localStorage.removeItem(`${dreamId}${i + 1}`);
        } else {
          swal("Your comment is safe!");
        }
      });
    } else {
      swal({
        text: "Trying to delete someone else's comment?",
        icon: "warning",
        button: "My Bad",
      });
    }
  }

  // set dream entry/comment ownership to local storage
  setStorage(key, status) {
    const localStorageItem = key
    const localItemStatus = [
            // will hold either author, liked, or index of comment written by user
            status
    ]
    window.localStorage.setItem(localStorageItem, localItemStatus);
}

  render() {
    // pull storage data for styling
    const dreams = this.state.dreams
    dreams.forEach((i) => {
      if (window.localStorage.getItem(`${i.key}liked`)) {
        setTimeout(() => {
          document.getElementsByClassName(`vote${i.key}`)[0].classList.add("liked");
        }, 0)
      }
    });

    return (
      <main className={'app'} idname="top">
        <div className='preloader'>
          <img src={cloudImg} alt="a pulsing cloud while app content loads" />
        </div>
        <div className="appBackground">
          <div className='backgroundImg'></div>
          <section className="top">
            <div>
              <h1>Dream Share</h1>
              <h2>A place for everyone to document their dreams and explore the bizarre world of the subconcious</h2>
              <form action="submit">
                <label htmlFor="newTitle">give your dream a title</label>
                <input onChange={this.handleTitle} value={this.state.inputTitle}type="text" id="newTitle" className="titleInput" placeholder="Title" maxLength="20"/>
                <label htmlFor="newDream">tell us about a dream you've had</label>
                <textarea 
                    name="newDream" 
                    id="newDream" 
                    className="dreamInput" 
                    rows="20" 
                    onChange={this.handleChange}
                    value={this.state.userInput} 
                    maxLength="1100"
                    placeholder="One night I dreamt..."
                ></textarea>
                <button className="addDream" onClick={this.handleClick}>Share Dream</button>
              </form>
            </div>
          </section>
          <section className="displaySection">
            <ul className="dreamDisplay wrapper">
              {
                this.state.dreams.map( (dreamObject) => {
                  return (
                  <li key={dreamObject.key} className={`returnDream dream${dreamObject.key}`}>
                    <h2>{dreamObject.data.title}</h2>
                    <p>{dreamObject.data.dream}</p>
                    <div className="upVote">
                      <p>{dreamObject.data.vote}</p>
                      <button aria-label="like this dream" className={`vote${dreamObject.key} voteButton`} name="like entry Button" onClick={() => this.handleVote(dreamObject.key)}><FontAwesomeIcon icon={faHeart}/></button>
                      <p>{dreamObject.data.comments.slice(1).length}</p>
                      <button aria-label="add a comment to this dream entry" className="commentbutton" name="add comment button" onClick={() => this.handleShowAddComment(dreamObject.key)}><FontAwesomeIcon icon={faComment}/></button>
                    </div>
                    <button aria-label="remove this dream entry" className="removeButton" name="remove entry button" onClick={() => this.handleRemove(dreamObject.key)}><FontAwesomeIcon icon={faTimes}/></button>
                    <form action="submit" className={`${dreamObject.key}input commentInput`}>
                      <label htmlFor="newComment" aria-label="add a comment"></label>
                      <input onChange={this.handleComment} value={this.state.dreams.inputComment}type="text" className={'commentSectionInput'} id={`${dreamObject.key}newComment newComment`} placeholder="Comment" maxLength="50"/>
                      <i className="addComment" onClick={() => this.handleAddComment(dreamObject.key)}><FontAwesomeIcon icon={faShare}/></i>
                    </form>
                    <div className="commentSection">
                        {
                          dreamObject.data.comments.slice(1).map((item, i) => 
                          <div key={i} className="commentChild">
                            <p>{item}</p>
                            <button aria-label="remove this comment"  name="remove comment button" className='removeCommentButton' onClick={() => this.handleRemoveComment(dreamObject.key, i)}><FontAwesomeIcon icon={faTimes}/></button>
                          </div>
                          )
                        }
                    </div>
                  </li>
                  )
                })
              }
            </ul>
          </section>
          <footer id='addedDream'>
            <a aria-label="Back to top" href="#top" id="backToTop"><FontAwesomeIcon icon={faAngleUp}/></a>
            <p>Created by <a href="https://alianicodes.com/" target="_blank" rel="noopener noreferrer">Arman Aliani</a></p>
          </footer>
        </div>
      </main>
    );
  }
}

export default App;
