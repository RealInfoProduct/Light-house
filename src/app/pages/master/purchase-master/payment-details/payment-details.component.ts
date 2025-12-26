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
    'paymentReceivedDate'
  ];
  
  Viewpayment: any = {};
 categoryList:any[] =[]

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
  const details = this.Viewpayment.paymentDetails;
  this.paymentDetailsDataSource = details;
}

 getCategoryList() {
      this.loaderService.setLoader(true)
      this.firebaseService.getAllCategory().subscribe((res: any) => {
        if (res) {
          this.categoryList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))   
          this.loaderService.setLoader(false)
        }
      })
    }

  getcompanyname(companyid:any){
    return this.categoryList.find((id: any) => id.id === companyid)?.companyName
  }
  
  getcategory(categoryid:any){
    return this.categoryList.find((id: any) => id.id === categoryid)?.category 
  }

  getsubcategory(keySpecifiCationsid:any){
    return this.categoryList.find((id: any) => id.id === keySpecifiCationsid)?.keySpecifiCations 
  }
}