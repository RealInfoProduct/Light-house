import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {  MatTable, MatTableDataSource } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-viewcompany',
  templateUrl: './viewcompany.component.html',
  styleUrls: ['./viewcompany.component.scss']
})
export class ViewcompanyComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'companyName',
    'category',
    'purchasePrice',
    'itemCount',
    'subTotal',
  ];
  
  Viewcompany: any = {};
 categoryList:any[] =[]

     companyDetailsDataSource = new MatTableDataSource<any>();
    @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);

  constructor( 
    public dialogRef: MatDialogRef<ViewcompanyComponent>, 
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
     private firebaseService: FirebaseService,
        private loaderService: LoaderService,
  ) { 
     this.Viewcompany = { ...data };
  }

  ngOnInit(): void {
  this.getCategoryList();
  const details = this.Viewcompany.companyDetails;
  this.companyDetailsDataSource = details;
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