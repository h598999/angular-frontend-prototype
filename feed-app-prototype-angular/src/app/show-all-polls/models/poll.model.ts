// poll.model.ts

export interface VoteOption {
  id: number;
  caption: string;
  votes: any[]; // Define the structure of a vote if needed
  pollId: number;
}

export interface Poll {
  id: number;
  question: string;
  hoursValid: number;
  validUntil: number;
  voteOptions: VoteOption[];
}

