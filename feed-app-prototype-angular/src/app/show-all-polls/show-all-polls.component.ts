import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  addVote, addVoteGuest, getPolls, deletePoll, getPoll, createGuestUser, createNewUser, loginUser} from '../../helpermethods/helpermethods';
import { createClient } from '../../helpermethods/socket_client'
import { Client } from "@stomp/stompjs";
import { Poll, VoteOption } from './models/poll.model';

@Component({
  selector: 'app-show-all-polls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-all-polls.component.html',
  styleUrl: './show-all-polls.component.css'
})
export class ShowAllPollsComponent implements OnInit {
  polls: any[] = [];
  error: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  client!: Client;

  constructor() { }


  async ngOnInit() {
    try{
      this.client = createClient(this.onVoteMessage, this.onPollMessage, this.onDeleteMessage);
      this.polls = await getPolls();
      loginUser("Jonas", "123");
    } catch (error) {
      this.errorMessage = 'An error ocurred while fetching polls.';
    } finally {
      this.isLoading = false;
    }
  }

  async handleVote(voteOption: VoteOption){
    try{
      let result: any = null;
      if (localStorage.getItem("JWT")){
        result = await addVote(voteOption);
      }
      if (result){
        const retrievedPoll = await getPoll(voteOption.pollId);
        const index = this.polls.findIndex(poll => poll.id === retrievedPoll.id);
        if (index !< 0){
          this.polls[index].voteOptions = retrievedPoll.voteOptions;
        }
      }
    } catch (error){
      console.error("Error in handleVote: " + error);
    }
  }

  onVoteMessage = (message: any) => {
    let body: string;

    if (message.isBinaryBody) {
      const binaryBody = message.binaryBody;
      body = new TextDecoder("utf-8").decode(binaryBody);
    } else {
      body = message.body;
    }

    console.log("Received message VOTE: " + body);
    try {
      const receivedPoll: Poll = JSON.parse(body);
      const index = this.polls.findIndex(poll => poll.id === receivedPoll.id);
      if (index !== -1) {
        this.polls[index] = receivedPoll;
      }
    } catch (error) {
      console.error('Could not parse message');
    }
  }

  async handleDeletePoll(pollId: number){
    try{
      await deletePoll(pollId);
      this.polls = this.polls.filter(poll=>poll.id !== pollId);
    } catch(error){
      console.log(error);
    }
  }

  onPollMessage = (message: any) => {
  let body: string;

  if (message.isBinaryBody) {
    const binaryBody = message.binaryBody;
    body = new TextDecoder("utf-8").decode(binaryBody);
  } else {
    body = message.body;
  }

  // Log the raw message body to ensure it is as expected
  console.log("Received raw message body: ", body);

  try {
    // Attempt to parse the message body
    const receivedPoll: any = JSON.parse(body);
    console.log("Parsed Poll object: ", receivedPoll);

    // Add to polls array and create a new reference to trigger Angular change detection
    this.polls = [...this.polls, receivedPoll];
    console.log("Updated Polls array: ", this.polls);
  } catch (error) {
    // Log the error to understand why parsing failed
    console.error('ERROR in CREATE: Failed to parse the message body', error);
  }
}


  onDeleteMessage = (message: any) => {
    let body: string;

    if (message.isBinaryBody) {
      const binaryBody = message.binaryBody;
      body = new TextDecoder("utf-8").decode(binaryBody);
    } else {
      body = message.body;
    }

    console.log("Received message DELETE: " + body);
    try {
      const pollId = Number(body);
      console.log(pollId);
      this.polls = this.polls.filter(poll => poll.id !== pollId);
      console.log(this.polls);
    } catch (error) {
      console.error(error);
    }
  }

}

