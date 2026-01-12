import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-income-expense-dialog',
  templateUrl: './income-expense-dialog.component.html',
  styleUrls: ['./income-expense-dialog.component.scss']
})
export class IncomeExpenseDialogComponent  implements OnInit{
  expenseForm: FormGroup;
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
     'Pending',
     'Unpaid' 
   ]
   partyList:any []=[]
   balanceList:any []=[]

  constructor(
      private fb: FormBuilder,
     public dialogRef: MatDialogRef<IncomeExpenseDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
         private firebaseService: FirebaseService,
            private loaderService: LoaderService,
  ){
     this.local_data = { ...data };
     this.action = this.local_data.action;
  }

  ngOnInit(): void {
      this.expenseFormlist() 
      this.getPartyList()
      this.getBalanceList()
        if (this.action === 'Edit') {
          this.expenseForm.patchValue(this.local_data);
          this.expenseForm.get('date')?.setValue(new Date(this.local_data.date.toDate()));
           this.expenseForm.get('bankName')?.setValue(this.local_data.bankName );
        }
  }

  expenseFormlist() {
     this.expenseForm = this.fb.group({
       id:[''],
       date: [new Date()],
       billNo:[''],
       paymentStatus:['Cash'],
       accounttype:['Income'],
       status:['Paid'],
       isActive:['other'],
       notes:[''],
       amount:[''],
       bankName:[''],
     })
   }

  Expensepayload(){
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      date:this.expenseForm.value.date,
      billNo: this.expenseForm.value.billNo,
      paymentStatus: this.expenseForm.value.paymentStatus,
      accounttype: this.expenseForm.value.accounttype,
      status: this.expenseForm.value.status,
      notes: this.expenseForm.value.notes,
      isActive: this.expenseForm.value.isActive,
      amount: this.expenseForm.value.amount,
      bankName: this.expenseForm.value.bankName
    }
    this.dialogRef.close({ event: this.action, data: payload });        
  }

  closeDialog() {
    this.dialogRef.close({ event: 'Cancel' });
  }

    getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
         this.setNotesValue();
        this.loaderService.setLoader(false)
      }
    })
  }

    getBalanceList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllBalance().subscribe((res: any[]) => {
      if (res) {
       const userBalance  = res.find(
          item => item.userId === localStorage.getItem('userId')
        );
            this.balanceList = userBalance ? userBalance.bankDetails : [];               
      }
      this.loaderService.setLoader(false);
    });
  }

  getpartyName(nameid: any) {
    return this.partyList.find((id: any) => id.id === nameid)?.partyName
  }

  setNotesValue() {
  const noteIdOrText = this.local_data.notes;
  const partyName = this.getpartyName(noteIdOrText);
  this.expenseForm.get('notes')?.setValue(partyName || noteIdOrText);
}


}
