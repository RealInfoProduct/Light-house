import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { WarrantyDialogComponent } from './warranty-dialog/warranty-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ViewWarrantyComponent } from './view-warranty/view-warranty.component';

@Component({
  selector: 'app-warranty-master',
  templateUrl: './warranty-master.component.html',
  styleUrls: ['./warranty-master.component.scss']
})
export class WarrantyMasterComponent implements OnInit {
  dateWarrantyListForm: FormGroup
  displayedColumns: string[] = [
    'firmName',
    'billNo',
    'invoiceNo',
    'date',
    'customerName',
    'address',
    'action',
  ];
  warrantyList: any[] = [];
  firmList: any[] = [];

  warrantyDataSource = new MatTableDataSource(this.warrantyList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getWarrantyList();
    this.dateform();
    this.getFirmList();
  }

  dateform() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateWarrantyListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  }


  applyFilter(filterValue: string): void {
    this.warrantyDataSource.filter = filterValue.trim().toLowerCase();
  }

  filterDate() {
    if (!this.warrantyList) return;
    const startDate = this.dateWarrantyListForm.value.start ? new Date(this.dateWarrantyListForm.value.start) : null;
    const endDate = this.dateWarrantyListForm.value.end ? new Date(this.dateWarrantyListForm.value.end) : null;

    if (startDate && endDate) {
      this.warrantyDataSource.data = this.warrantyList.filter((invoice: any) => {
        if (!invoice.date) return false;

        let invoiceDate;
        if (invoice.date.toDate) {
          invoiceDate = invoice.date.toDate();
        } else if (invoice.date instanceof Date) {
          invoiceDate = invoice.date;
        } else {
          return false;
        }

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.warrantyDataSource.data = this.warrantyList;
    }
  }

  addWarranty(action: any, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(WarrantyDialogComponent, { data: obj });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      if (result.event === 'Add') {
        const payload = {
          ...result.data,
          userId: localStorage.getItem('userId')
        };

        await this.firebaseService.addWarranty(payload);
        this.getWarrantyList();
        this.openConfigSnackBar('record create successfully');
      }
      if (result.event === 'Edit') {
        const payload = {
          ...result.data,
          userId: localStorage.getItem('userId')
        };

        await this.firebaseService.updateWarranty(result.data.id, payload);
        this.getWarrantyList();
        this.openConfigSnackBar('record create successfully');
      }
      if (result.event === 'Delete') {
        this.firebaseService.deleteWarranty(result.data.id).then((res: any) => {
          this.getWarrantyList()
          this.openConfigSnackBar('record delete successfully')
        }, (error) => {

        })
      }


    })
  }

  getWarrantyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllWarranty().subscribe((res: any) => {
      if (res) {
        this.warrantyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
      }
      this.warrantyDataSource = new MatTableDataSource(this.warrantyList);
      this.warrantyDataSource.paginator = this.paginator;
      this.filterDate()
      this.loaderService.setLoader(false)
    })
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  viewWarrantyDetails(obj: any) {
    const dialogRef = this.dialog.open(ViewWarrantyComponent, { data: obj });
  }

  getFirmList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllFirm().subscribe((res: any) => {
      if (res) {
        this.firmList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getFinalfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.header || '';
  }

  getFinalsubHeaderfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.subHeader || '';
  }

}
