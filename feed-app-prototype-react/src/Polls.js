// Polls.js

import React, { useState, useEffect } from 'react';
import { 
  addVote, 
  addVoteGuest, 
  getPolls, 
  deletePoll, 
  getPoll,
  loginUser, 
} from './helpermethods.js'; // Adjust the import path accordingly
import { createClient } from './socket_client.js';

import { 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText 
} from '@mui/material'; // Using Material-UI for UI components

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState(null);
  let clientRef = React.useRef(null);

  useEffect(() => {
    // Initialize WebSocket
    clientRef.current = createClient(onVoteMessage, onPollMessage, onDeleteMessage);

    // Load initial polls
    loadPolls();
    loginUser("Jonas", "123");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPolls = async () => {
    try {
      const fetchedPolls = await getPolls();
      setPolls(fetchedPolls);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  const handleVote = async (voteOption) => {
    try {
      let result = null;

      if (localStorage.getItem("JWT")) {
        result = await addVote(voteOption);
      } else if (localStorage.getItem("guest-id")) {
        result = await addVoteGuest(voteOption);
      } else {
        alert("You have to be logged in as either a guest or a user to vote");
        return;
      }

      if (result) {
        const retrievedPoll = await getPoll(voteOption.pollId);
        setPolls(prevPolls => prevPolls.map(poll => 
          poll.id === retrievedPoll.id ? retrievedPoll : poll
        ));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeletePoll = async (pollId) => {
    try {
      await deletePoll(pollId);
      setPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollId));
    } catch (error) {
      console.log(error);
    }
  };

  const onVoteMessage = (message) => {
    let body;

    if (message.isBinaryBody) {
      const binaryBody = message.binaryBody;
      body = new TextDecoder("utf-8").decode(binaryBody);
    } else {
      body = message.body;
    }

    console.log("Received message VOTE: " + body);
    try {
      const receivedPoll = JSON.parse(body);
      setPolls(prevPolls => prevPolls.map(poll => 
        poll.id === receivedPoll.id ? receivedPoll : poll
      ));
    } catch (error) {
      console.error('Could not parse message');
    }
  };

  const onPollMessage = (message) => {
    let body;

    if (message.isBinaryBody) {
      const binaryBody = message.binaryBody;
      body = new TextDecoder("utf-8").decode(binaryBody);
    } else {
      body = message.body;
    }

    console.log("Received message CREATE: " + body);
    try {
      const receivedPoll = JSON.parse(body);
      setPolls(prevPolls => [...prevPolls, receivedPoll]);
      console.log(polls);
    } catch (error) {
      console.error('Could not parse message');
    }
  };

  const onDeleteMessage = (message) => {
    let body;

    if (message.isBinaryBody) {
      const binaryBody = message.binaryBody;
      body = new TextDecoder("utf-8").decode(binaryBody);
    } else {
      body = message.body;
    }

    console.log("Received message DELETE: " + body);
    try {
      const pollId = Number(body);
      setPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollId));
      console.log(polls);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {polls.length > 0 && <h1>Polls</h1>}
      {error && <div>Error: {error}</div>}
      <div className="container">
        {polls.length === 0 ? (
          <h1>No polls :(</h1>
        ) : (
          polls.map(poll => (
            <Card key={poll.id} className="poll-card" sx={{ maxWidth: 500, margin: '20px auto' }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {poll.question}
                </Typography>
                <List>
                  {poll.voteOptions.map(option => (
                    <ListItem key={option.id}>
                      <ListItemText 
                        primary={option.caption} 
                        secondary={`Number of votes: ${option.votes.length}`} 
                      />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => handleVote(option)}
                      >
                        Upvote
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={() => handleDeletePoll(poll.id)}
                >
                  Delete Poll
                </Button>
              </CardActions>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Polls;

