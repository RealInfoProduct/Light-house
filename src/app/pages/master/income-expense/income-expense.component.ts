import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { IncomeExpenseDialogComponent } from './income-expense-dialog/income-expense-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExpensesList } from 'src/app/interface/invoice';

@Component({
  selector: 'app-income-expense',
  templateUrl: './income-expense.component.html',
  styleUrls: ['./income-expense.component.scss']
})
export class IncomeExpenseComponent implements OnInit, AfterViewInit{
  dateIncomeexpenseListForm:FormGroup
  displayedColumns: string[] = [
    'srno',
    'billNo',
    'date',
    'status',
    'accountType',
    'notes',
    'finalAmount',
    'action',
  ];
  incomeExpenseList:any [] =[]
  partyList:any []=[]

  
  incomeExpenseDataSource = new MatTableDataSource(this.incomeExpenseList);
    @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(  
    private dialog: MatDialog,
     private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,
    ){}

  ngOnInit(): void {
    this.getExpensesList()  
      this.dateform()    
      this.getPartyList()
  }

   ngAfterViewInit() {
    this.incomeExpenseDataSource.paginator = this.paginator;
  }

  dateform() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateIncomeexpenseListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  }

  filterDate() {
    if (!this.incomeExpenseList) return;
    const startDate = this.dateIncomeexpenseListForm.value.start ? new Date(this.dateIncomeexpenseListForm.value.start) : null;
    const endDate = this.dateIncomeexpenseListForm.value.end ? new Date(this.dateIncomeexpenseListForm.value.end) : null;

    if (startDate && endDate) {
      this.incomeExpenseDataSource.data = this.incomeExpenseList.filter((invoice: any) => {
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
      this.incomeExpenseDataSource.data = this.incomeExpenseList;
    }
  }

    getStatusClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'status-paid';
      case 'Unpaid':
        return 'status-unpaid';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  }

    applyFilter(filterValue: string): void {
    this.incomeExpenseDataSource.filter = filterValue.trim().toLowerCase();
  }

  addIncomeExpense(action: string, obj: any){
     obj.action = action;
    const dialogRef = this.dialog.open(IncomeExpenseDialogComponent,{ data: obj})

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.event === 'Add') {
            const payload: ExpensesList = {
              id: '',
              date: result.data.date,
              billNo: result.data.billNo,
              amount: result.data.amount,
              // bank: result.data.bank,
              notes: result.data.notes,
              paymentStatus: result.data.paymentStatus,
              accounttype: result.data.accounttype,
              status: result.data.status,
              isActive: result.data.isActive,
              userId : localStorage.getItem("userId"),
            }
            this.firebaseService.addExpenses(payload).then((res) => {
              if (res) {
                this.getExpensesList()
                this.openConfigSnackBar('record create successfully')
              }
            }, (error) => {
            
            })
          }
          if (result?.event === 'Edit') {
            this.incomeExpenseList.forEach((element: any) => {
              if (element.id === result.data.id) {
                const payload: ExpensesList = {
                  id: result.data.id,
                  date: result.data.date,
                  billNo: result.data.billNo,
                  amount: result.data.amount,
                  // bank: result.data.bank,
                  notes: result.data.notes,
                  paymentStatus: result.data.paymentStatus,
                  accounttype: result.data.accounttype,
                  status: result.data.status,
                  isActive: result.data.isActive, 
                  userId : localStorage.getItem("userId"),
                }
                this.firebaseService.updateExpenses(result.data.id, payload).then((res: any) => {
                    this.getExpensesList()
                this.openConfigSnackBar('record update successfully')
                }, (error) => {
                
                })
              }
            });
          }
          if (result?.event === 'Delete') {
            this.firebaseService.deleteExpenses(result.data.id).then((res: any) => {
                this.getExpensesList()
                this.openConfigSnackBar('record delete successfully')
            }, (error) => {
            
            })
          }
        });
  }


    getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.incomeExpenseList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
         this.incomeExpenseDataSource = new MatTableDataSource(this.incomeExpenseList);
        this.incomeExpenseDataSource.paginator = this.paginator;
        this.loaderService.setLoader(false)
      }
    })
  }

    openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
  });
}


   getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getpartyName(nameid: any) {
    return this.partyList.find((id: any) => id.id === nameid)?.partyName
}


}
