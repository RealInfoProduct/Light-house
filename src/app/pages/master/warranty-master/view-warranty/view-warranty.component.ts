import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ViewShellComponent } from '../../shell/view-shell/view-shell.component';

@Component({
  selector: 'app-view-warranty',
  templateUrl: './view-warranty.component.html',
  styleUrls: ['./view-warranty.component.scss']
})
export class ViewWarrantyComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'Date',
    'companyName',
    'category',
    'qty',
    'warranty',
    'warrantyDate',
    'warrantyType',
  ];

  Viewcompany: any = {};
  warrantyList: any[] = []
  categoryList: any[] = []


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
    this.getWarrantyList()
    this.getCategoryList()

    const details = this.Viewcompany.shellDetails;


    this.shellDetailsDataSource = details;

  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'status-Completed';
      case 'in Progress':
        return 'status-inProgress';
      case 'Pending':
        return 'status-Pending';
      default:
        return '';
    }
  }

  getWarrantyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllWarranty().subscribe((res: any) => {
      if (res) {
        this.warrantyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
      }
      this.loaderService.setLoader(false)
    })
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

  getcompanyname(companyid: any) {
    return this.categoryList.find((id: any) => id.id === companyid)?.companyName
  }

  getcategory(categoryid: any) {
    return this.categoryList.find((id: any) => id.id === categoryid)?.category
  }

  getsubcategory(keySpecifiCationsid: any) {
    return this.categoryList.find((id: any) => id.id === keySpecifiCationsid)?.keySpecifiCations
  }
}