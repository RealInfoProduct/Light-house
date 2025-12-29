import { Component, OnInit,  ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellDialogComponent } from './shell-dialog/shell-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ShellList } from 'src/app/interface/invoice';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ViewShellComponent } from './view-shell/view-shell.component';
import { SalePaymentDetailsComponent } from './sale-payment-details/sale-payment-details.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import moment from 'moment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
 dateSaleListForm: FormGroup;
  displayedColumns: string[] = [
    'billNo',
    'invoiceNo',
    'date',
    'customerName',
    'address',
    'customerMobileNo',
     'status',
    'finalAmount',
    'recivedAmount',
    'pendingAmount',
    'action',
  ];

  shellList: any[] = []
  categoryList:any []=[]

  shellDataSource = new MatTableDataSource(this.shellList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);


  constructor(
    private dialog: MatDialog,
     private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getShellList()
    this.getCategoryList()
   this.dateform()
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
  if (!element.total) return 0;
  return element.paymentDetails
    ? element.total - this.getTotalReceived(element.paymentDetails)
    : element.total;
}

  getTotalReceived(paymentDetails: any[]): number {
    if (!paymentDetails || paymentDetails.length === 0) {
      return 0;
    }
    return paymentDetails.reduce((sum, item) => sum + (item.paymentR || 0), 0);
  }

  // addShell(action: string, obj: any) {
  //   obj.action = action;
  //   const dialogRef = this.dialog.open(ShellDialogComponent, { data: obj });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const payload: ShellList = {
  //         id: '',
  //         invoiceNo: result.data.invoiceNo,
  //         billNumber: result.data.billNumber,
  //         date: result.data.date,
  //         customerName: result.data.customerName,
  //         customerAddress: result.data.customerAddress,
  //         total: result.data.total,
  //         extraDiscount: result.data.extraDiscount,
  //         mobileNumber: result.data.mobileNumber,
  //         grandTotal: result.data.grandTotal,
  //         shellDetails: result.data.shellDetails.map((detail: any) => ({
  //           productsName: detail.productsName,
  //           qty: detail.qty,
  //           productPrice: detail.productPrice,
  //           discount: detail.discount,
  //           subTotal: detail.subTotal,
  //         })),
  //         userId: localStorage.getItem("userId")
  //       };


  //       this.firebaseService.addShell(payload).then((res) => {
  //         if (res) {
  //           this.getShellList()
  //           this.openConfigSnackBar('record create successfully')
  //         }
  //       }, (error) => {

  //       })
  //     }
  //     if (result?.event === 'Edit') {
  //       this.shellList.forEach((element: any) => {
  //         if (element.id === result.data.id) {
  //           const payload: ShellList = {
  //             id: result.data.id,
  //             invoiceNo: result.data.invoiceNo,
  //             billNumber: result.data.billNumber,
  //             date: result.data.date,
  //             customerName: result.data.customerName,
  //             customerAddress: result.data.customerAddress,
  //             mobileNumber: result.data.mobileNumber,
  //             total: result.data.total,
  //             extraDiscount: result.data.extraDiscount,
  //             grandTotal: result.data.grandTotal,
  //             userId: localStorage.getItem("userId"),
  //             shellDetails: result.data.shellDetails.map((detail: any) => ({
  //               productsName: detail.productsName,
  //               qty: detail.qty,
  //               productPrice: detail.productPrice,
  //                discount: detail.discount,
  //               subTotal: detail.subTotal,
  //             })),

  //           };

  //           this.firebaseService.updateShell(result.data.id, payload).then((res: any) => {
  //             this.getShellList()
  //             this.openConfigSnackBar('record update successfully')
  //           }, (error) => {

  //           })
  //         }
  //       });
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deleteShell(result.data.id).then((res: any) => {
  //         this.getShellList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {

  //       })
  //     }
  //   });
  // }

  addShell(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(ShellDialogComponent, { data: obj });
  
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.event) return;
  
      const userId = localStorage.getItem("userId");
  
      // HELPER FUNCTION: Update stock in Firebase
      const updateStock = async (categoryId: string, countChange: number) => {
        const categoryItem = this.categoryList.find((cat:any) => cat.id === categoryId);
        if (categoryItem) {
          categoryItem.stockCount = (categoryItem.stockCount || 0) - countChange;
          await this.firebaseService.updateCategory(categoryItem.id, categoryItem);
        }
      };
  
      // ADD PURCHASE
      if (result.event === 'Add') {
        const payload: ShellList = {
         id: '',
          invoiceNo: result.data.invoiceNo,
          billNumber: result.data.billNumber,
          date: result.data.date,
          customerName: result.data.customerName,
          customerAddress: result.data.customerAddress,
          total: result.data.total,
          extraDiscount: result.data.extraDiscount,
          mobileNumber: result.data.mobileNumber,
          grandTotal: result.data.grandTotal,
          paymentStatus: result.data.paymentStatus,
            paymentReceived:result.data.paymentReceived,
          shellDetails: result.data.shellDetails.map((detail: any) => ({
            companyName: detail.companyName.id,
            category: detail.category.id,
            qty: detail.qty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          })),
           paymentDetails: result.data.paymentDetails.map((detail: any) => ({
          paymentR: detail.paymentR,
          paymentReceivedDate: detail.paymentReceivedDate
        })),
          userId: localStorage.getItem("userId")
        };
  
        // Update stock in Firebase
        for (const detail of payload.shellDetails) {
          await updateStock(detail.companyName, detail.qty);
        }
  
        await this.firebaseService.addShell(payload);
        this.getShellList()
        this.openConfigSnackBar('Record created successfully');
      }
  
      // EDIT PURCHASE
      if (result.event === 'Edit') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;
  
        // Subtract old itemCount
        for (const oldDetail of oldPurchase.shellDetails) {
          await updateStock(oldDetail.companyName, -oldDetail.qty);
        }
  
        const payload: ShellList = {
          id: result.data.id,
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
               paymentReceived:result.data.paymentReceived,
              shellDetails: result.data.shellDetails.map((detail: any) => ({
                companyName: detail.companyName.id,
                category: detail.category.id,
                qty: detail.qty,
                productPrice: detail.productPrice,
                discount: detail.discount,
                subTotal: detail.subTotal,
              })),
              paymentDetails: result.data.paymentDetails.map((detail: any) => ({
                paymentR: detail.paymentR,
                paymentReceivedDate: detail.paymentReceivedDate
              })),
              userId: localStorage.getItem("userId")

            };
        
  
        // Add new itemCount
        for (const detail of payload.shellDetails) {
          await updateStock(detail.companyName, detail.qty);
        }
  
        await this.firebaseService.updateShell(result.data.id, payload);
        this.getShellList()
        this.openConfigSnackBar('Record updated successfully');
      }
  
      // DELETE PURCHASE
      if (result.event === 'Delete') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;
  
        // Subtract old itemCount from stock
        for (const detail of oldPurchase.shellDetails) {
          await updateStock(detail.companyName, -detail.qty);
        }
  
        await this.firebaseService.deleteShell(result.data.id);
        this.getShellList()
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

      }

      this.shellDataSource = new MatTableDataSource(this.shellList);
      this.shellDataSource.paginator = this.paginator;
      this.loaderService.setLoader(false)

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
 
     const TotalAmounttotal = filteredData.reduce((sum, item) => sum + parseFloat(item.total), 0);
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
        const totalAmount = item.total || 0;
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
 
   const totalAmount = item.total || 0;
 
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
   

}
