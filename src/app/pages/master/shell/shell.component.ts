import { AfterViewInit, Component, OnInit,  ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellDialogComponent } from './shell-dialog/shell-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ExpensesList, ShellList } from 'src/app/interface/invoice';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ViewShellComponent } from './view-shell/view-shell.component';
import { SalePaymentDetailsComponent } from './sale-payment-details/sale-payment-details.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import moment from 'moment';
import jsPDF from 'jspdf';
import { MatSort } from '@angular/material/sort';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit ,AfterViewInit {
 dateSaleListForm: FormGroup;
  displayedColumns: string[] = [
    'firmName',
    'billNo',
    'invoiceNo',
    'date',
    'customerName',
    'address',
    // 'customerMobileNo',
     'status',
    'finalAmount',
    'recivedAmount',
    'pendingAmount',
    'action',
  ];

  shellList: any[] = []
  categoryList:any []=[]
  incomeExpenseList:any []=[]
   balanceList:any =[]
  firmList: any = []

  shellDataSource = new MatTableDataSource(this.shellList);
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
    this.getShellList();
    this.getCategoryList();
    this.dateform();
    this.getExpensesList();
    this.getBalanceList();
    this.getFirmList();
  }

  ngAfterViewInit() {
    this.shellDataSource.sort = this.sort; 
  }

   dateform() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateSaleListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  }

   filterDate() {
    if (!this.shellList) return;
    const startDate = this.dateSaleListForm.value.start ? new Date(this.dateSaleListForm.value.start) : null;
    const endDate = this.dateSaleListForm.value.end ? new Date(this.dateSaleListForm.value.end) : null;

    if (startDate && endDate) {
      this.shellDataSource.data = this.shellList.filter((invoice: any) => {
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
      this.shellDataSource.data = this.shellList;
    }
  }

  applyFilter(filterValue: string): void {
    this.shellDataSource.filter = filterValue.trim().toLowerCase();
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

  getFinalStatus(element: any): string {
  return this.getPendingAmount(element) === 0 ? 'Paid' : element.paymentStatus;
}

 getPendingAmount(element: any): number {
  if (!element.grandTotal) return 0;
  return element.paymentDetails
    ? element.grandTotal - this.getTotalReceived(element.paymentDetails)
    : element.grandTotal;
}

  getTotalReceived(paymentDetails: any[]): number {
    if (!paymentDetails || paymentDetails.length === 0) {
      return 0;
    }
    return paymentDetails.reduce((sum, item) => sum + (item.paymentR || 0), 0);
  }

  async updateBalance(paymentDetails: any[], reverse: boolean = false) {
  if (!this.balanceList || !paymentDetails?.length) return;

  for (const payment of paymentDetails) {
    const amount = Number(payment.paymentR) || 0;
    const finalAmount = reverse ? -amount :  amount;

    if (payment.paymentType === 'Cash') {
      this.balanceList.cashBalance =
        (this.balanceList.cashBalance || 0) + finalAmount;
    }

    else if (payment.bankName) {
      const bank = this.balanceList.bankDetails?.find(
        (b: any) => b.id === payment.bankName
      );

      if (bank) {
        bank.balance = (bank.balance || 0) + finalAmount;
      }
    }
  }

  await this.firebaseService.updateBalance(
    this.balanceList.id,
    this.balanceList
  );
}

  addShell(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(ShellDialogComponent, { data: obj });
  
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.event) return;
  
      const userId = localStorage.getItem("userId");
  
      const updateStock = async (categoryId: string, countChange: number) => {
        const categoryItem = this.categoryList.find((cat:any) => cat.id === categoryId);
        if (categoryItem) {
          categoryItem.stockCount = (categoryItem.stockCount || 0) - countChange;
          await this.firebaseService.updateCategory(categoryItem.id, categoryItem);
        }
      };
  
      if (result.event === 'Add') {
        const payload: ShellList = {
         id: '',
          invoiceNo: result.data.invoiceNo,
          firmName: result.data.firmName,
          billNumber: result.data.billNumber,
          date: result.data.date,
          customerName: result.data.customerName,
          customerAddress: result.data.customerAddress,
          total: result.data.total,
          extraDiscount: result.data.extraDiscount,
          mobileNumber: result.data.mobileNumber,
          grandTotal: result.data.grandTotal,
          otherKharch: result.data.otherKharch,
          paymentStatus: result.data.paymentStatus,
          paymentReceived:result.data.paymentReceived,
          type: result.data.type,
          selected: result.data.selected,
          shellDetails: result.data.shellDetails.map((detail: any) => ({
            saleDate: detail.saleDate,
            companyName: detail.companyName.id,
            category: detail.category.id,
            qty: detail.qty,
            warranty:detail.warranty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          })),
           paymentDetails: result.data.paymentDetails.map((detail: any) => ({
          paymentR: detail.paymentR,
          paymentReceivedDate: detail.paymentReceivedDate,
          paymentType: detail.paymentType,
          bankName: detail.bankName?.id || ''
        })),
          userId: localStorage.getItem("userId")
        };
  
        for (const detail of payload.shellDetails) {
          await updateStock(detail.category, detail.qty);
        }

        await this.firebaseService.addShell(payload);
          await this.updateBalance(payload.paymentDetails);

        const expensePayload: ExpensesList = {
          id: '',
          date: result.data.date,
          billNo: result.data.billNumber || '',
          invoiceNo:  result.data.invoiceNo ||'',
          amount: result.data.grandTotal,
          notes: result.data.customerName || '',
          paymentStatus: result.data.paymentDetails?.[0]?.paymentType || 'Cash',
          accounttype: result.data.type || '',
          status: result.data.paymentStatus,
          userId: localStorage.getItem("userId")
        };

        await this.firebaseService.addExpenses(expensePayload);
         if (payload.selected) {
             await this.sendWhatsAppMessage(payload);
            }
        console.log(expensePayload);
        this.getShellList()
         this.getBalanceList();
        this.getExpensesList();
        this.openConfigSnackBar('Record created successfully');
      }
  
      if (result.event === 'Edit') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;
         await this.updateBalance(oldPurchase.paymentDetails, true);
        for (const oldDetail of oldPurchase.shellDetails) {
          await updateStock(oldDetail.category, -oldDetail.qty);
        }
  
        const payload: ShellList = {
          id: result.data.id,
          firmName: result.data.firmName,
          invoiceNo: result.data.invoiceNo,
          billNumber: result.data.billNumber,
          date: result.data.date,
          customerName: result.data.customerName,
          customerAddress: result.data.customerAddress,
          mobileNumber: result.data.mobileNumber,
          total: result.data.total,
          extraDiscount: result.data.extraDiscount,
          grandTotal: result.data.grandTotal,
          paymentStatus: result.data.paymentStatus,
          otherKharch: result.data.otherKharch,
          paymentReceived: result.data.paymentReceived,
          type: result.data.type,
          selected: result.data.selected,
          shellDetails: result.data.shellDetails.map((detail: any) => ({
            saleDate: detail.saleDate,
            companyName: detail.companyName.id,
            category: detail.category.id,
            qty: detail.qty,
            warranty: detail.warranty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          })),
          paymentDetails: result.data.paymentDetails.map((detail: any) => ({
            paymentR: detail.paymentR,
            paymentReceivedDate: detail.paymentReceivedDate,
            paymentType: detail.paymentType,
            bankName: detail.bankName?.id || ''
          })),
          userId: localStorage.getItem("userId")

        };
       

          const oldExpense = this.incomeExpenseList.find(
        (el: any) => el.invoiceNo === result.data.invoiceNo
      );

      const expensePayload: ExpensesList = {
        id: oldExpense ? oldExpense.id : '',
        date: result.data.date,
          billNo: result.data.billNumber || '',
           invoiceNo:  result.data.invoiceNo ||'',
          amount: result.data.grandTotal,
          notes: result.data.customerName || '',
          paymentStatus: result.data.paymentDetails?.[0]?.paymentType || 'Cash',
          accounttype: result.data.type || '',
          status: result.data.paymentStatus,
        userId: localStorage.getItem('userId')
      };

      if (oldExpense) {
        await this.firebaseService.updateExpenses(
          oldExpense.id,
          expensePayload
        );
      } else {
        await this.firebaseService.addExpenses(expensePayload);
      }
 
        for (const detail of payload.shellDetails) {
          await updateStock(detail.category, detail.qty);
        }
         await this.updateBalance(payload.paymentDetails);

        await this.firebaseService.updateShell(result.data.id, payload);

          if (payload.selected) {
                await this.sendWhatsAppMessage(payload);
            }
        this.getShellList();
        this.getBalanceList();
        this.openConfigSnackBar('Record updated successfully');
      }
  
      if (result.event === 'Delete') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;

        await this.updateBalance(oldPurchase.paymentDetails, true);

        for (const detail of oldPurchase.shellDetails) {
          await updateStock(detail.category, -detail.qty);
        }
        const oldExpense = this.incomeExpenseList.find(
        (el: any) =>  el.invoiceNo === oldPurchase.invoiceNo && el.billNo === oldPurchase.billNumber
      );

      await this.firebaseService.deleteShell(result.data.id);
      if (oldExpense) {
        await this.firebaseService.deleteExpenses(oldExpense.id);
      }
  
        this.getShellList();
        this.getBalanceList();
        this.openConfigSnackBar('Record deleted successfully');
      }
    });
  }

  updateCategory(category: any, data: any) {
  return this.firebaseService.updateCategory(category, data);
}

  getShellList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllShell().subscribe((res: any) => {
      if (res) {
        this.shellList = res
          .filter((id: any) => id.userId === localStorage.getItem("userId"))
          .map((item: any) => ({
            ...item,
            date: this.parseDate(item.date)
          }));
      this.shellList.sort((a, b) => {
        const numA = parseInt(a.invoiceNo.replace(/\D/g, ''), 10);
        const numB = parseInt(b.invoiceNo.replace(/\D/g, ''), 10);
        return numB - numA;
      });
    }
      this.shellDataSource = new MatTableDataSource(this.shellList);
      this.shellDataSource.paginator = this.paginator;
      this.shellDataSource.sort = this.sort;
      this.loaderService.setLoader(false)

    })
  }

    getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.incomeExpenseList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  parseDate(dateValue: any): Date {

    if (dateValue && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const cleaned = dateValue.replace(" at ", " ");
      return new Date(cleaned);
    }

    return new Date(dateValue);
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  viewShellDetails(obj: any) {
      const dialogRef = this.dialog.open(ViewShellComponent, { data: obj });
   }

  paymentDetails(obj: any) {
    const dialogRef = this.dialog.open(SalePaymentDetailsComponent, { data: obj });
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

  getFirmList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllFirm().subscribe((res: any) => {
      if (res) {
        this.firmList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  filedownload() {
    const doc: any = new jsPDF();
    doc.setFontSize(13);
    const filteredData: any[] = this.shellDataSource.data;

    if (!filteredData || filteredData.length === 0) {
      window.alert("No Shell data available for the selected filters.");
      return;
    }

    const startDate = this.dateSaleListForm.value.start;
    const endDate = this.dateSaleListForm.value.end;

    const formattedStart = new Date(startDate).toLocaleDateString('en-GB');
    const formattedEnd = new Date(endDate).toLocaleDateString('en-GB');

    doc.text(`Report Date: ${formattedStart} To ${formattedEnd}`, 14, 15);

    const TotalAmounttotal = filteredData.reduce((sum, item) => sum + parseFloat(item.grandTotal), 0);
    const FinalTotalAmount = Math.round(TotalAmounttotal).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`Final Total: ${(FinalTotalAmount)}`, 135, 11);

    const RecivedtotalAmount = filteredData.reduce((sum: number, item: any) => {
      if (item.paymentDetails && Array.isArray(item.paymentDetails)) {
        return sum + item.paymentDetails.reduce((innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0), 0);
      }
      return sum;
    }, 0);
    const RecivedAmount = Math.round(RecivedtotalAmount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`Spent Total: ${(RecivedAmount)}`, 135, 19);

    const PendingtotalAmount = filteredData.reduce((sum: number, item: any) => {
      const paymentReceived = item.paymentDetails?.reduce(
        (innerSum: number, pd: any) => innerSum + (parseFloat(pd.paymentR) || 0),
        0
      ) || 0;
      const totalAmount = item.grandTotal || 0;
      return sum + (totalAmount - paymentReceived);
    }, 0);

    const PendingAmount = Math.round(PendingtotalAmount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    doc.text(`Pending Total: ${PendingAmount}`, 135, 27);

    const headers = [
      "Sr.No",
      "Bill No",
      "Invoice No",
      "Date",
      "Customer Name",
      "Customer Mobile",
      "Status",
      "Amount Final",
      "Amount Spent",
      "Pending Amount"
    ];

    const data = filteredData.map((item, i) => {

      const dateStr = moment(item.date).format('DD/MM/YYYY');

      const paymentReceived = item.paymentDetails.reduce(
        (sum: number, pd: any) => sum + (pd.paymentR || 0),
        0
       );
 
   const totalAmount = item.grandTotal || 0;
 
   const pendingAmount = totalAmount - paymentReceived;
       return [
         i + 1,
         item.billNumber,
         item.invoiceNo,
         dateStr,
         item.customerName,
         item.mobileNumber,
         item.paymentStatus,
         totalAmount,
         paymentReceived,
         pendingAmount
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
 
     doc.save(`Shell Report.pdf`);
   }

  setPaymentStatusColor(doc: jsPDF, status: string) {
    switch (status) {
      case 'Paid':
        doc.setTextColor(46, 204, 113); // Green
        break;
      case 'Pending':
        doc.setTextColor(241, 196, 15); // Yellow/Orange
        break;
      case 'Unpaid':
        doc.setTextColor(231, 76, 60); // Red
        break;
      default:
        doc.setTextColor(0, 0, 0); // Black
    }
  }

  fileDataDownload(item: any) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const firm = this.firmList.find((f: any) => f.id === item.firmName);

    const PAGE_WIDTH = 210;
    let currentY = 10;

    /* =========================
       HEADER BAR
    ========================= */
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, PAGE_WIDTH, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const firmTitle = `${this.getFinalfirm(item.firmName) || ''} ${this.getFinalsubHeaderfirm(item.firmName) || ''}`.toUpperCase();
    doc.text(firmTitle || 'YOUR COMPANY NAME', 10, 15);
    // doc.text( `${this.getFinalfirm(item.firmName)} ${this.getFinalsubHeaderfirm(item.firmName)}`|| 'YOUR COMPANY NAME', 10, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Address: ${firm.address || ''}`, 10, 22);
    doc.text(`Phone: ${firm.mobileNo || ''}`, 10, 27);
    doc.text(`GST: ${firm.gstNo || ''}`, 10, 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('INVOICE', PAGE_WIDTH - 10, 22, { align: 'right' });

    currentY = 45;

    /* =========================
       INVOICE META BOX
    ========================= */
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    // doc.rect(130, currentY - 10, 70, 28, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Invoice No:', 155, currentY);
    doc.text(`${item.invoiceNo}`, 195, currentY, { align: 'right' });

    doc.text('Bill No:', 155, currentY + 6);
    doc.text(` ${item.billNumber}`, 195, currentY + 6, { align: 'right' });

    doc.text('Date:', 155, currentY + 12);
    doc.text(moment(item.date).format('DD/MM/YYYY'), 195, currentY + 12, { align: 'right' });

    /* =========================
       BILL TO
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('BILL TO', 10, currentY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Name: ${item.customerName}`, 10, currentY + 7);
    doc.text(`Address: ${item.customerAddress || 'No address provided'}`, 10, currentY + 13);
    doc.text(`Mobile: ${item.mobileNumber || 'N/A'}`, 10, currentY + 19);

    /* =========================
       TABLE
    ========================= */
    const headers = [
      'Sr',
      'Date',
      'Company',
      'Category',
      'Warranty',
      'Qty',
      'Price',
      'Disc %',
      'Total'
    ];

    const body = item.shellDetails.map((row: any, i: number) => [
      i + 1,
      moment(row.date).format('DD/MM/YYYY'),
      this.getCompanyName(row.companyName),
      `${this.getCategoryName(row.category)} ${this.getkeySpecifiCations(row.category)}`,
      row.warranty,
      row.qty,
      row.productPrice,
      row.discount,
      row.subTotal
    ]);

    (doc as any).autoTable({
      head: [headers],
      body,
      startY: currentY + 30,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        3: { halign: 'left' }
      }
    });

    const tableEndY = (doc as any).lastAutoTable.finalY + 10;

    /* =========================
       PAYMENT SUMMARY BOX
    ========================= */
    const receivedAmount =
      item.paymentDetails?.reduce(
        (sum: number, p: any) => sum + (Number(p.paymentR) || 0),
        0
      ) || 0;

    const pendingAmount = (item.grandTotal || 0) - receivedAmount;

    doc.setFillColor(245, 247, 250);
    doc.rect(120, tableEndY, 80, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 160, tableEndY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text('Total:', 125, tableEndY + 16);
    doc.text(String(item.total), 195, tableEndY + 16, { align: 'right' });

    doc.text('Discount:', 125, tableEndY + 22);
    doc.text(String(item.extraDiscount), 195, tableEndY + 22, { align: 'right' });

    doc.text('Final Amount:', 125, tableEndY + 28);
    doc.text(String(item.grandTotal), 195, tableEndY + 28, { align: 'right' });

    doc.text('Pending:', 125, tableEndY + 34);
    doc.text(String(pendingAmount), 195, tableEndY + 34, { align: 'right' });

    /* =========================
       FOOTER
    ========================= */
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      'Thank you for your business!',
      PAGE_WIDTH / 2,
      290,
      { align: 'center' }
    );

    doc.save(`Invoice_${item.billNumber}.pdf`);
  }

  getCompanyName(companyId: any) {
    return this.categoryList.find((c: any) => c.id === companyId)?.companyName || '';
  }

  getCategoryName(categoryId: any) {
    return this.categoryList.find((c: any) => c.id === categoryId)?.category || '';
  }

  getkeySpecifiCations(categoryId: any) {
    return this.categoryList.find((c: any) => c.id === categoryId)?.keySpecifiCations || '';
  }
  
  getFinalfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.header || '';
  }

  getFinalsubHeaderfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.subHeader || '';
  }
//   async sendWhatsAppMessage(order: any) {
//   if (!order.selected) return;

//   if (!order.mobileNumber) {
//     this._snackBar.open('Mobile number is missing!', 'OK', { duration: 3000 });
//     return;
//   }

//   this.loaderService.setLoader(true);

//   try {

    
//     let phone = order.mobileNumber.toString().replace(/\D/g, '');

    
//     if (phone.length === 10) {
//       phone = '91' + phone;
//     }

//     // 4. WhatsApp Message
//     const message = encodeURIComponent(
//       `*Hello ${order.customerName || ''}!*\n\n` +
//       `Thank you for your purchase.\n` +
//       `Here is your invoice:\n\n` +
//       `Bill No: *${order.billNumber}*\n` +
//       `Invoice No: *${order.invoiceNo}*\n` +
//       `Date: ${moment(order.date).format('DD/MM/YYYY')}\n` +
//       `Amount: *₹${order.grandTotal}*\n\n` +
//       `Please check the attached PDF.\n` +
//       `Regards,\n${this.getFinalfirm(order.firmName) || 'Team'}`
//     );

//   const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;

// window.open(whatsappUrl, '_blank');


//     this._snackBar.open('PDF Downloaded & WhatsApp Opened!', 'OK', { duration: 3000 });

//   } catch (err) {
//     console.error(err);
//     this._snackBar.open('Failed to send WhatsApp message', 'OK', { duration: 4000 });
//   } finally {
//     this.loaderService.setLoader(false);
//   }
// }

async sendWhatsAppMessage(order: any) {
  if (!order.selected) return;

  if (!order.mobileNumber) {
    this._snackBar.open('Mobile number is missing!', 'OK', { duration: 3000 });
    return;
  }

  this.loaderService.setLoader(true);

  try {
    // Prepare phone number
    let phone = order.mobileNumber.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    // Generate PDF as Blob
    // const pdfBlob = this.generatePDFBlob(order); // We'll create this function

    // // Create downloadable URL
    // const pdfUrl = URL.createObjectURL(pdfBlob);

    // // WhatsApp message with PDF link
    // const message = encodeURIComponent(
    //   `*Hello ${order.customerName || ''}!*\n\n` +
    //   `Thank you for your purchase.\n` +
    //   `Here is your invoice:\n\n` +
    //   `Bill No: *${order.billNumber}*\n` +
    //   `Invoice No: *${order.invoiceNo}*\n` +
    //   `Date: ${moment(order.date).format('DD/MM/YYYY')}\n` +
    //   `Amount: *₹${order.grandTotal}*\n\n` +
    //   `Click here to download your invoice PDF: ${pdfUrl}\n\n` +
    //     `Regards,\n${this.getFinalfirm(order.firmName) || 'Team'}`
    //   );

       const pdfBlob = this.generatePDFBlob(order);
const pdfUrl = URL.createObjectURL(pdfBlob);
const clickableText = "`" + pdfUrl + "`"; 

const message = encodeURIComponent(
  `*Hello ${order.customerName || ''}!*\n\n` +
  `Thank you for your purchase.\n` +
  `Here is your invoice:\n\n` +
  `Bill No: *${order.billNumber}*\n` +
  `Invoice No: *${order.invoiceNo}*\n` +
  `Date: ${moment(order.date).format('DD/MM/YYYY')}\n` +
  `Amount: *₹${order.grandTotal}*\n\n` +
  
 `Click here : ${clickableText}\n\n` +
  `Regards,\n${this.getFinalfirm(order.firmName) || 'Team'}`
);

  

    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
    window.open(whatsappUrl, '_blank');

    this._snackBar.open('PDF Generated & WhatsApp Opened!', 'OK', { duration: 3000 });

  } catch (err) {
    console.error(err);
    this._snackBar.open('Failed to send WhatsApp message', 'OK', { duration: 4000 });
  } finally {
    this.loaderService.setLoader(false);
  }
}

// Function to generate PDF as Blob instead of directly saving
generatePDFBlob(item: any): Blob {
  const doc = new jsPDF('p', 'mm', 'a4');
   const firm = this.firmList.find((f: any) => f.id === item.firmName);

    const PAGE_WIDTH = 210;
    let currentY = 10;

    /* =========================
       HEADER BAR
    ========================= */
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, PAGE_WIDTH, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const firmTitle = `${this.getFinalfirm(item.firmName) || ''} ${this.getFinalsubHeaderfirm(item.firmName) || ''}`.toUpperCase();
    doc.text(firmTitle || 'YOUR COMPANY NAME', 10, 15);
    // doc.text( `${this.getFinalfirm(item.firmName)} ${this.getFinalsubHeaderfirm(item.firmName)}`|| 'YOUR COMPANY NAME', 10, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Address: ${firm.address || ''}`, 10, 22);
    doc.text(`Phone: ${firm.mobileNo || ''}`, 10, 27);
    doc.text(`GST: ${firm.gstNo || ''}`, 10, 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('INVOICE', PAGE_WIDTH - 10, 22, { align: 'right' });

    currentY = 45;

    /* =========================
       INVOICE META BOX
    ========================= */
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    // doc.rect(130, currentY - 10, 70, 28, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Invoice No:', 155, currentY);
    doc.text(`${item.invoiceNo}`, 195, currentY, { align: 'right' });

    doc.text('Bill No:', 155, currentY + 6);
    doc.text(` ${item.billNumber}`, 195, currentY + 6, { align: 'right' });

    doc.text('Date:', 155, currentY + 12);
    doc.text(moment(item.date).format('DD/MM/YYYY'), 195, currentY + 12, { align: 'right' });

    /* =========================
       BILL TO
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('BILL TO', 10, currentY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Name: ${item.customerName}`, 10, currentY + 7);
    doc.text(`Address: ${item.customerAddress || 'No address provided'}`, 10, currentY + 13);
    doc.text(`Mobile: ${item.mobileNumber || 'N/A'}`, 10, currentY + 19);

    /* =========================
       TABLE
    ========================= */
    const headers = [
      'Sr',
      'Date',
      'Company',
      'Category',
      'Warranty',
      'Qty',
      'Price',
      'Disc %',
      'Total'
    ];

    const body = item.shellDetails.map((row: any, i: number) => [
      i + 1,
      moment(row.date).format('DD/MM/YYYY'),
      this.getCompanyName(row.companyName),
      `${this.getCategoryName(row.category)} ${this.getkeySpecifiCations(row.category)}`,
      row.warranty,
      row.qty,
      row.productPrice,
      row.discount,
      row.subTotal
    ]);

    (doc as any).autoTable({
      head: [headers],
      body,
      startY: currentY + 30,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        3: { halign: 'left' }
      }
    });

    const tableEndY = (doc as any).lastAutoTable.finalY + 10;

    /* =========================
       PAYMENT SUMMARY BOX
    ========================= */
    const receivedAmount =
      item.paymentDetails?.reduce(
        (sum: number, p: any) => sum + (Number(p.paymentR) || 0),
        0
      ) || 0;

    const pendingAmount = (item.grandTotal || 0) - receivedAmount;

    doc.setFillColor(245, 247, 250);
    doc.rect(120, tableEndY, 80, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 160, tableEndY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text('Total:', 125, tableEndY + 16);
    doc.text(String(item.total), 195, tableEndY + 16, { align: 'right' });

    doc.text('Discount:', 125, tableEndY + 22);
    doc.text(String(item.extraDiscount), 195, tableEndY + 22, { align: 'right' });

    doc.text('Final Amount:', 125, tableEndY + 28);
    doc.text(String(item.grandTotal), 195, tableEndY + 28, { align: 'right' });

    doc.text('Pending:', 125, tableEndY + 34);
    doc.text(String(pendingAmount), 195, tableEndY + 34, { align: 'right' });

    /* =========================
       FOOTER
    ========================= */
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      'Thank you for your business!',
      PAGE_WIDTH / 2,
      290,
      { align: 'center' }
    );

  return doc.output('blob');
}



}
