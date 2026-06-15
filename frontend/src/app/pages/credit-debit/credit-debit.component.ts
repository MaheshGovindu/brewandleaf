import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CreditDebit, Order } from '../../models/brew-and-leaf.models';

@Component({
  selector: 'app-credit-debit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-debit.component.html',
  styleUrls: ['./credit-debit.component.scss']
})
export class CreditDebitComponent implements OnInit {
  transactions: CreditDebit[] = [];
  orders: Order[] = [];
  showAddModal = false;
  newTransaction: CreditDebit = {
    type: 'credit',
    amount: 0,
    description: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadOrders();
  }

  loadTransactions(): void {
    this.apiService.getCreditDebit().subscribe(data => {
      this.transactions = data;
    });
  }

  loadOrders(): void {
    this.apiService.getOrders().subscribe(data => {
      this.orders = data;
    });
  }

  openAddModal(): void {
    this.newTransaction = {
      type: 'credit',
      amount: 0,
      description: ''
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addTransaction(): void {
    this.apiService.addCreditDebit(this.newTransaction).subscribe(() => {
      this.loadTransactions();
      this.closeAddModal();
    });
  }

  deleteTransaction(id: number): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.apiService.deleteCreditDebit(id).subscribe(() => {
        this.loadTransactions();
      });
    }
  }
}
