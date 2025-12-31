import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-income-expense-dialog',
  templateUrl: './income-expense-dialog.component.html',
  styleUrls: ['./income-expense-dialog.component.scss']
})
export class IncomeExpenseDialogComponent  implements OnInit{
  ExpenseForm: FormGroup;
   action: string;
  local_data: any;
 paymenttype: any = [
     'Cash',
     'G-Pay' 
   ]

   accounttype: any = [
     'Income',
     'Expense' 
   ]

   statustype: any = [
     'Paid',
     'Pending' 
   ]

  constructor(
      private fb: FormBuilder,
     public dialogRef: MatDialogRef<IncomeExpenseDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ){
     this.local_data = { ...data };
     this.action = this.local_data.action;
  }

  ngOnInit(): void {
      this.ExpenseFormlist() 
        if (this.action === 'Edit') {
          this.ExpenseForm.patchValue(this.local_data);
        }
  }

  ExpenseFormlist() {
     this.ExpenseForm = this.fb.group({
       id:[''],
       date: [new Date()],
       billno:[''],
       paymenttype:['Cash'],
       accounttype:['Income'],
       status:['Paid'],
       notes:[''],
       amount:['']
     })
   }

  Expensepayload(){
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      date:this.ExpenseForm.value.date,
      billno: this.ExpenseForm.value.billno,
      paymenttype: this.ExpenseForm.value.paymenttype,
      accounttype: this.ExpenseForm.value.accounttype,
      status: this.ExpenseForm.value.status,
      notes: this.ExpenseForm.value.notes,
      amount: this.ExpenseForm.value.amount,

    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog() {
    this.dialogRef.close({ event: 'Cancel' });
  }

}
