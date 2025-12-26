import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-view-shell',
  templateUrl: './view-shell.component.html',
  styleUrls: ['./view-shell.component.scss']
})
export class ViewShellComponent implements OnInit{
  displayedColumns: string[] = [
    'srno',
    'companyName',
    'qty',
    'prouctPrice',
    'discount',
    'finalTotal',
  ];
  
  Viewcompany: any = {};
 shellList:any[] =[]
 categoryList :any []=[]
 

     shellDetailsDataSource = new MatTableDataSource<any>();
    @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);

  constructor( 
    public dialogRef: MatDialogRef<ViewShellComponent>, 
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
     private firebaseService: FirebaseService,
        private loaderService: LoaderService,
  ) { 
     this.Viewcompany = { ...data };
  }

  ngOnInit(): void {
  this.getShellList();
  this.getCategoryList()

  const details = this.Viewcompany.shellDetails;
  

  this.shellDetailsDataSource = details;
  
}

 getShellList() {
      this.loaderService.setLoader(true)
      this.firebaseService.getAllShell().subscribe((res: any) => {
        if (res) {
          this.shellList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))   
          this.loaderService.setLoader(false)
        }
      })
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