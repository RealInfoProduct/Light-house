import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { WarrantyDialogComponent } from './warranty-dialog/warranty-dialog.component';

@Component({
  selector: 'app-warranty-master',
  templateUrl: './warranty-master.component.html',
  styleUrls: ['./warranty-master.component.scss']
})
export class WarrantyMasterComponent  implements OnInit{
  dateWarrantyListForm: FormGroup

    @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);
   @ViewChild(MatSort) sort!: MatSort;

  constructor(  private dialog: MatDialog, private fb: FormBuilder,){}

  ngOnInit(): void {
      this.dateform();
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
    // this.shellDataSource.filter = filterValue.trim().toLowerCase();
  }

  filterDate (){}

  addWarranty(action:any, obj:any){
    obj.action = action;
    const dialogRef = this.dialog.open(WarrantyDialogComponent, { data: obj });
  }


}
