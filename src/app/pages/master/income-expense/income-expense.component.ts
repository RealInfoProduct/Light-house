import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { IncomeExpenseDialogComponent } from './income-expense-dialog/income-expense-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import moment from 'moment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-income-expense',
  templateUrl: './income-expense.component.html',
  styleUrls: ['./income-expense.component.scss']
})
export class IncomeExpenseComponent implements OnInit, AfterViewInit {
  dateIncomeexpenseListForm: FormGroup
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
  incomeExpenseList: any[] = []
  partyList: any[] = []
  balanceList: any = [];


  incomeExpenseDataSource = new MatTableDataSource(this.incomeExpenseList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.getExpensesList();
    this.dateform();
    this.getPartyList();
    this.getBalanceList();
  }

  ngAfterViewInit() {
    this.incomeExpenseDataSource.paginator = this.paginator;
  }

  getBillNo(element: any): string {
    if (element?.accounttype === 'Income') {
      return `${element?.invoiceNo ?? ''}${(element?.invoiceNo && element?.billNo) ? `(${element.billNo})` : element?.billNo ?? ''}`;
    }
    return element?.billNo ?? '';
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

  async updateBalance(amount: number, accounttype: 'Income' | 'Expense', paymentStatus: string, bankId?: string) {
    if (!this.balanceList?.id) {
      await this.getBalanceList();
    }

    const amt = Number(amount);
    if (!amt) return;

    const finalAmount = accounttype === 'Income' ? amt : -amt;

    // CASH
    if (paymentStatus === 'Cash') {
      this.balanceList.cashBalance =
        Number(this.balanceList.cashBalance || 0) + finalAmount;
    }

    // BANK
    if (paymentStatus !== 'Cash' && bankId) {
      const bank = this.balanceList.bankDetails.find(
        (b: any) => b.id === bankId
      );
      if (bank) {
        bank.balance = Number(bank.balance || 0) + finalAmount;
      }
    }

    await this.firebaseService.updateBalance(
      this.balanceList.id,
      {
        cashBalance: this.balanceList.cashBalance,
        bankDetails: this.balanceList.bankDetails
      }
    );
  }

  reverseEntry(entry: any) {
    return this.updateBalance(
      entry.amount,
      entry.accounttype === 'Income' ? 'Expense' : 'Income',
      entry.paymentStatus,
      entry.bankName
    );
  }

  // addIncomeExpense(action: string, obj: any){
  //    obj.action = action;
  //   const dialogRef = this.dialog.open(IncomeExpenseDialogComponent,{ data: obj})

  //       dialogRef.afterClosed().subscribe((result) => {
  //         if (result?.event === 'Add') {
  //           const payload = {
  //             id: '',
  //             date: result.data.date,
  //             billNo: result.data.billNo,
  //             amount: result.data.amount,
  //             notes: result.data.notes,
  //             paymentStatus: result.data.paymentStatus,
  //             accounttype: result.data.accounttype,
  //             status: result.data.status,
  //             isActive: result.data.isActive,
  //             bankName: result.data.bankName,
  //             userId : localStorage.getItem("userId"),
  //           }
  //           this.firebaseService.addExpenses(payload).then((res) => {
  //             if (res) {
  //               this.getExpensesList()
  //               this.openConfigSnackBar('record create successfully')
  //             }
  //           }, (error) => {

  //           })
  //         }
  //         if (result?.event === 'Edit') {
  //           this.incomeExpenseList.forEach((element: any) => {
  //             if (element.id === result.data.id) {
  //               const payload = {
  //                 id: result.data.id,
  //                 date: result.data.date,
  //                 billNo: result.data.billNo,
  //                 amount: result.data.amount,
  //                 notes: result.data.notes,
  //                 paymentStatus: result.data.paymentStatus,
  //                 accounttype: result.data.accounttype,
  //                 status: result.data.status,
  //                 isActive: result.data.isActive, 
  //                 bankName: result.data.bankName,
  //                 userId : localStorage.getItem("userId"),
  //               }
  //               this.firebaseService.updateExpenses(result.data.id, payload).then((res: any) => {
  //                   this.getExpensesList()
  //               this.openConfigSnackBar('record update successfully')
  //               }, (error) => {

  //               })
  //             }
  //           });
  //         }
  //         if (result?.event === 'Delete') {
  //           this.firebaseService.deleteExpenses(result.data.id).then((res: any) => {
  //               this.getExpensesList()
  //               this.openConfigSnackBar('record delete successfully')
  //           }, (error) => {

  //           })
  //         }
  //       });
  // }

  addIncomeExpense(action: string, row: any) {
    row.action = action;

    const dialogRef = this.dialog.open(IncomeExpenseDialogComponent, {
      data: row
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;

      if (result.event === 'Add') {
        const payload = {
          ...result.data,
          userId: localStorage.getItem('userId')
        };

        await this.firebaseService.addExpenses(payload);

        if (payload.status === 'Paid') {
          await this.updateBalance(
            payload.amount,
            payload.accounttype,
            payload.paymentStatus,
            payload.bankName
          );
        }

        this.getExpensesList();
        this.openConfigSnackBar('record create successfully');
      }

      if (result.event === 'Edit') {
        const oldData = this.incomeExpenseList.find(
          e => e.id === result.data.id
        );

        if (oldData?.status === 'Paid') {
          await this.reverseEntry(oldData);
        }

        if (result.data.status === 'Paid') {
          await this.updateBalance(
            result.data.amount,
            result.data.accounttype,
            result.data.paymentStatus,
            result.data.bankName
          );
        }

        await this.firebaseService.updateExpenses(
          result.data.id,
          result.data
        );

        this.getExpensesList();
        this.openConfigSnackBar('record update successfully');
      }

      if (result.event === 'Delete') {

        const oldData = this.incomeExpenseList.find(
          e => e.id === result.data.id
        );

        if (!oldData) {
          console.error('Old data not found for delete');
          return;
        }

        if (oldData.status === 'Paid') {
          await this.reverseEntry(oldData);
        }

        await this.firebaseService.deleteExpenses(oldData.id);

        this.getExpensesList();
        this.openConfigSnackBar('record delete successfully');
      }
    });
  }

  getBalanceList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllBalance().subscribe((res: any[]) => {
      if (res) {
        const found = res.find(
          item => item.userId === localStorage.getItem('userId')
        );
        this.balanceList = found ? found : { cashBalance: 0, bankDetails: [], id: '', userId: localStorage.getItem('userId') };
      }
      this.loaderService.setLoader(false);
    });
  }
  getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.incomeExpenseList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.incomeExpenseDataSource = new MatTableDataSource(this.incomeExpenseList);
        this.incomeExpenseDataSource.paginator = this.paginator;
        this.filterDate()
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

  filedownload() {
    const doc: any = new jsPDF();
    doc.setFontSize(13);
    const filteredData: any[] = this.incomeExpenseDataSource.data;

    if (!filteredData || filteredData.length === 0) {
      window.alert("No Income/Expense data available for the selected filters.");
      return;
    }

    const startDate = this.dateIncomeexpenseListForm.value.start;
    const endDate = this.dateIncomeexpenseListForm.value.end;

    const formattedStart = new Date(startDate).toLocaleDateString('en-GB');
    const formattedEnd = new Date(endDate).toLocaleDateString('en-GB');

    doc.text(`Report Date: ${formattedStart} To ${formattedEnd}`, 14, 15);

    const TotalAmounttotal = filteredData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const FinalTotalAmount = Math.round(TotalAmounttotal).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`Final Total: ${(FinalTotalAmount)}`, 135, 11);

    const IncomeTotalAmount = filteredData.reduce((sum: number, item: any) => {
      if (item.accounttype === "Income") {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);

    const IncomeAmountFormatted = Math.round(IncomeTotalAmount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    doc.text(`Income Total: ${IncomeAmountFormatted}`, 135, 19);

    const ExpenseTotalAmount = filteredData.reduce((sum: number, item: any) => {
      if (item.accounttype === "Expense") {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);

    const ExpenseAmountFormatted = Math.round(ExpenseTotalAmount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    doc.text(`Expense Total: ${ExpenseAmountFormatted}`, 135, 27);



    const headers = [
      "Sr.No",
      "Bill No",
      "Date",
      "Status",
      "Account Type",
      "Notes",
      "Amount"
    ];

    const data = filteredData.map((item, i) => {

      const dateStr = moment.unix(item.date.seconds).format('DD/MM/YYYY');
      const notes = this.partyList.find((prod: any) => prod.id === item.notes)?.partyName || item.notes;
      return [
        i + 1,
        item.billNo && item.invoiceNo ? `${item.invoiceNo}(${item.billNo})` : item.billNo || item.invoiceNo || '',
        dateStr,
        item.status,
        item.accounttype,
        notes,
        parseFloat(item.amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      ];
    });

    const MIN_ROWS = 35;
    if (data.length < MIN_ROWS) {
      for (let idx = data.length; idx < MIN_ROWS; idx++) {
        data.push([
          idx + 1,
          '',
          '',
          '',
          '',
          ''
        ]);
      }
    }

    doc.setFontSize(10);
    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 32,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 187, 0],
        textColor: [8, 8, 8],
        fontStyle: 'bold'
      },
      styles: {
        textColor: [8, 8, 8],
        fontSize: 8,
        valign: 'middle',
        halign: 'center'
      }
    });

    doc.save(`Income/Expense Report.pdf`);
  }


}
