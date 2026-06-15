import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactionsByDate: any = {};
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.apiService.getTransactions().subscribe(data => {
      this.transactionsByDate = data;
      this.loading = false;
    });
  }

  getSortedDates(): string[] {
    return Object.keys(this.transactionsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  getDateSummary(date: string): { total: number; cash: number; online: number; count: number } {
    const transactions = this.transactionsByDate[date];
    let total = 0;
    let cash = 0;
    let online = 0;
    
    transactions.forEach((tx: any) => {
      total += tx.final_amount;
      if (tx.payment_method === 'cash') {
        cash += tx.final_amount;
      } else if (tx.payment_method === 'online') {
        online += tx.final_amount;
      }
    });
    
    return { total, cash, online, count: transactions.length };
  }
}
