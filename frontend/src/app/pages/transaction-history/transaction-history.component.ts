import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { TransactionRecord } from '../../models/brew-and-leaf.models';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactionsByDate: Record<string, TransactionRecord[]> = {};
  loading = true;
  startDate = '';
  endDate = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.apiService.getTransactions({
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    }).subscribe(data => {
      this.transactionsByDate = data;
      this.loading = false;
    });
  }

  applyFilters(): void {
    this.loadTransactions();
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadTransactions();
  }

  getSortedDates(): string[] {
    return Object.keys(this.transactionsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  getDateSummary(date: string): { total: number; cash: number; online: number; count: number; totalCost: number; totalMargin: number; totalProfit: number } {
    const transactions = this.transactionsByDate[date];
    let total = 0;
    let cash = 0;
    let online = 0;
    let totalCost = 0;
    let totalMargin = 0;
    let totalProfit = 0;
    
    transactions.forEach((tx: TransactionRecord) => {
      total += Number(tx.final_amount || 0);
      totalCost += Number(tx.total_cost || 0);
      totalMargin += Number(tx.total_margin || 0);
      totalProfit += Number(tx.total_profit || 0);
      if (tx.payment_method === 'cash') {
        cash += Number(tx.final_amount || 0);
      } else if (tx.payment_method === 'online') {
        online += Number(tx.final_amount || 0);
      }
    });
    
    return { total, cash, online, count: transactions.length, totalCost, totalMargin, totalProfit };
  }
}
