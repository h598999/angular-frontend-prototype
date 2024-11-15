<script setup>

import {
  addVote,
  getPolls,
  deletePoll,
  getPoll,
  loginUser,
} from '@/helpermethods/helpermethods.js'

import { ref, onMounted, onBeforeUnmount} from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { createClient } from '@/helpermethods/Socket_Client'

const polls = ref([])
const error = ref(null)
let client;
async function handleVote(voteOption) {
  try {

  let result = null;

  if (localStorage.getItem("JWT")){
    result = await addVote(voteOption)
  } else {
    alert("You have to be logged in as either a guest or a user to vote");
  }
    if (result) {
      let retrievedPoll = await getPoll(voteOption.pollId);
      polls.value
      .find(poll => poll.id === retrievedPoll.id)
      .voteOptions = retrievedPoll.voteOptions
    } } catch (error) {
    console.log(error)
  }
}

function onVoteMessage(message){
let body;

  if (message.isBinaryBody) {
    let binaryBody = message.binaryBody;
    body = new TextDecoder("utf-8").decode(binaryBody);
  } else {
    body = message.body;
  }
  console.log("Recieved message VOTE: " + body)
  try{
  let recievedPoll = JSON.parse(body);
     let index = polls.value
      .findIndex(poll => poll.id === recievedPoll.id)
      polls.value.splice(index, 1, recievedPoll)
  } catch(error){
    console.error('Could not parse message');
  }
}

function onPollMessage(message){
let body;

  if (message.isBinaryBody) {
    // Decode the binary body to a string
    let binaryBody = message.binaryBody;
    body = new TextDecoder("utf-8").decode(binaryBody);
  } else {
    // If the body is already a string
    body = message.body;
  }
  console.log("Recieved message CREATE: " + body)
  try{
  let recievedPoll = JSON.parse(body);
      polls.value.push(recievedPoll)
      console.log(polls.value)

  } catch(error){
    console.error('Could not parse message');
  }
}

function onDeleteMessage(message){
let body;

  if (message.isBinaryBody) {
    // Decode the binary body to a string
    let binaryBody = message.binaryBody;
    body = new TextDecoder("utf-8").decode(binaryBody);
  } else {
    // If the body is already a string
    body = message.body;
  }
  console.log("Recieved message DELETE: " + body)
  try{
  let pollindex = Number(body);
      console.log(pollindex)
      polls.value = polls.value.filter(poll => poll.id !== pollindex)
      console.log(polls.value)
  } catch(error){
    console.error(error);
  }
}

async function handleDeletePoll(pollId) {
  try {
    await deletePoll(pollId)
    polls.value = polls.value.filter(poll => poll.id !== pollId)
  } catch (error) {
    console.log(error)
  }
}

onMounted(async () => {
  try {
    loginUser("Jonas","123");
    client = createClient(onVoteMessage,onPollMessage,onDeleteMessage);
    polls.value = await getPolls()
  } catch (e) {
    error.value = e
  }
})

onBeforeUnmount(() => {
  if (client) {
    client.deactivate(); // Properly deactivate the WebSocket client
    console.log('WebSocket client deactivated.')
  }
})


</script>

<template>
  <h1 v-if="polls.length > 0">Polls</h1>
  <div v-if="error">Error : {{ error }}</div>
  <div class="container">
    <h1 v-if="polls.length === 0">No polls :(</h1>
    <div v-else class="poll" v-for="poll in polls" :key="poll.id">
      <Card class="card">
        <template #title>
          {{ poll.question }}
        </template>
        <template #content>
          <p class="expired" v-if="poll.validUntil === 0">Poll Expired</p>
          <ul>
            <li v-for="voteoption in poll.voteOptions" :key="voteoption.id">
              <h3>{{ voteoption.caption }}</h3>
              <Button
                label="Upvote"
                @click="handleVote(voteoption)"
              ></Button>
              <h4>Number of votes: {{ voteoption.votes.length }}</h4>
            </li>
          </ul>
        </template>
        <template #footer> <div class="footer">
            <Button
              label="Delete Poll"
              class="delete"
              @click="handleDeletePoll(poll.id)"
            ></Button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* General container styling */
div.container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
}

/* Poll card styling */
div.poll {
  margin: 10px;
  flex: 1 1 calc(33% - 40px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
  transition: transform 0.2s;
}

div.poll:hover {
  transform: translateY(-5px);
}

/* Card specific styling */
.card {
  padding: 15px;
  border-radius: 8px;
}

/* Title and content styling */
h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

h3 {
  font-size: 1.2em;
  margin: 5px 0;
}

h4 {
  font-size: 1em;
  margin: 0;
  color: #666;
}

/* Button styling */
Button {
  margin: 10px 5px;
  border-radius: 4px;
  padding: 5px 15px;
}

Button.delete {
  background-color: #e74c3c;
  color: white;
}

Button.delete:hover {
  background-color: #c0392b;
}

Button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Footer section styling */
div.footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #ddd;
}

/* Styling for expired polls */
p.expired {
  color: red;
  font-weight: bold;
  margin: 5px 0;
}

/* List and item styling */
ul {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

li:last-child {
  border-bottom: none;
}
</style>
