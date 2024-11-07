import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getPolls } from '../client.js';

@Component({
  selector: 'app-show-all-polls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-all-polls.component.html',
  styleUrl: './show-all-polls.component.css'
})
export class ShowAllPollsComponent implements OnInit {
  polls: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor() { }

  async ngOnInit() {
    try{
      this.polls = await getPolls();
      console.log(this.polls);
    } catch (error) {
      this.errorMessage = 'An error ocurred while fetching polls.';
    } finally {
      this.isLoading = false;
    }
  }

}
