import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-payment-details',
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.scss']
})
export class PaymentDetailsComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'paymentR',
    'paymentReceivedDate',
    'paymenttype'
  ];

  Viewpayment: any = {};
  categoryList: any[] = []
  balanceList: any = []

  paymentDetailsDataSource = new MatTableDataSource<any>();
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);

  constructor(
    public dialogRef: MatDialogRef<PaymentDetailsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
  ) {
    this.Viewpayment = { ...data };
  }

  ngOnInit(): void {
    this.getCategoryList();
    this.getBalanceList();
    const details = this.Viewpayment.paymentDetails;
    this.paymentDetailsDataSource = details;
  }

  getCategoryList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getBalanceList() {
    this.loaderService.setLoader(true);
    this.firebaseService.getAllBalance().subscribe((res: any[]) => {
      if (res) {
        this.balanceList = res.find(
          item => item.userId === localStorage.getItem('userId')
        );

      }
      this.loaderService.setLoader(false);
    });
  }
  getBankname(bankId: any, paymentType: string) {

    // ✅ CASH case
    if (paymentType === 'Cash') {
      return '-';
    }

    // ✅ Only Bank payment
    if (paymentType === 'G-Pay') {
      debugger

      const bankName = this.balanceList?.bankDetails
        ?.find((b: any) => b.id == bankId)
        ?.bankName;

      return bankName || '-';
    }
    return '-';
  }
}