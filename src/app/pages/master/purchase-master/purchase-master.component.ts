import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { PurchaseList } from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { PurchaseMasterDialogComponent } from './purchase-master-dialog/purchase-master-dialog.component';
import { ViewcompanyComponent } from './viewcompany/viewcompany.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';


@Component({
  selector: 'app-purchase-master',
  templateUrl: './purchase-master.component.html',
  styleUrls: ['./purchase-master.component.scss']
})
export class PurchaseMasterComponent implements OnInit {
  datePurchaseListForm: FormGroup;

  displayedColumns: string[] = [
    'srno',
    'billNo',
    'PartyName',
    'date',
    'status',
    'finalAmount',
    'recivedAmount',
    'pendingAmount',
    'action',
  ];
  purchaseList: any = []
  partyList: any = []
  categoryList: any = []

  productDataSource = new MatTableDataSource(this.purchaseList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,) { }


  ngOnInit(): void {
    this.getpurchaseList()
    this.getPartyList()
    this.getCategoryList()
    this.SearchFilter()
    this.dateform()
  }

  dateform() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.datePurchaseListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  }

  filterDate() {
    if (!this.purchaseList) return;
    const startDate = this.datePurchaseListForm.value.start ? new Date(this.datePurchaseListForm.value.start) : null;
    const endDate = this.datePurchaseListForm.value.end ? new Date(this.datePurchaseListForm.value.end) : null;

    if (startDate && endDate) {
      this.productDataSource.data = this.purchaseList.filter((invoice: any) => {
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
      this.productDataSource.data = this.purchaseList;
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

  getPendingAmount(element: any): number {
  if (!element.total) return 0;
  return element.paymentDetails
    ? element.total - this.getTotalReceived(element.paymentDetails)
    : element.total;
}

getFinalStatus(element: any): string {
  return this.getPendingAmount(element) === 0 ? 'Paid' : element.paymentStatus;
}



  applyFilter(filterValue: string): void {
    this.productDataSource.filter = filterValue.trim().toLowerCase();
     this.SearchFilter() 
  }

  SearchFilter() {
    this.productDataSource.filterPredicate = (data: any, filter: string) => {
      const searchText = filter.trim().toLowerCase();
       const billNo = data.billNo?.toString().toLowerCase() || '';
      const status = data.paymentStatus?.toLowerCase() || '';

      const partyName =
        this.partyList.find((p: any) => p.id === data.isParty)?.partyName
          ?.toLowerCase() || '';

      return (
        billNo.includes(searchText) ||
        status.includes(searchText) ||
        partyName.includes(searchText)
      );
    };
  }

  // addPurchase(action: string, obj: any) {
  //   obj.action = action;
  //   const dialogRef = this.dialog.open(PurchaseMasterDialogComponent, { data: obj });
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const payload: PurchaseList = {
  //         id: '',
  //         billNo: result.data.billNo,
  //         isParty: result.data.isParty.id,
  //         date: result.data.date,
  //         paymentStatus: result.data.paymentStatus,
  //         total: result.data.total,
  //         paymentReceived: result.data.paymentReceived,
  //         companyDetails: result.data.companyDetails.map((detail: any) => ({
  //           companyName: detail.companyName.id,
  //           category: detail.category.id,
  //           purchasePrice: detail.purchasePrice,
  //           itemCount: detail.itemCount,
  //           subTotal: detail.subTotal,
  //         })),
  //         paymentDetails: result.data.paymentDetails.map((detail: any) => ({
  //           paymentR: detail.paymentR,
  //           paymentReceivedDate: detail.paymentReceivedDate
  //         })),
  //         userId: localStorage.getItem("userId")
  //       };


  //       this.firebaseService.addPurchase(payload).then((res) => {
  //         if (res) {
  //           this.getpurchaseList()
  //           this.openConfigSnackBar('record create successfully')
  //         }
  //       }, (error) => {

  //       })
  //     }
  //     if (result?.event === 'Edit') {
  //       this.purchaseList.forEach((element: any) => {
  //         if (element.id === result.data.id) {
  //           const payload: PurchaseList = {
  //             id: result.data.id,
  //             billNo: result.data.billNo,
  //             isParty: result.data.isParty.id,
  //             date: result.data.date,
  //             paymentStatus: result.data.paymentStatus,
  //             total: result.data.total,
  //             paymentReceived: result.data.paymentReceived,
  //             companyDetails: result.data.companyDetails.map((detail: any) => ({
  //               companyName: detail.companyName.id,
  //               category: detail.category.id,
  //               purchasePrice: detail.purchasePrice,
  //               itemCount: detail.itemCount,
  //               subTotal: detail.subTotal,
  //             })),
  //             paymentDetails: result.data.paymentDetails.map((detail: any) => ({
  //               paymentR: detail.paymentR,
  //               paymentReceivedDate: detail.paymentReceivedDate
  //             })),
  //             userId: localStorage.getItem("userId")
  //           };

  //           this.firebaseService.updatePurchase(result.data.id, payload).then((res: any) => {
  //             this.getpurchaseList()
  //             this.openConfigSnackBar('record update successfully')
  //           }, (error) => {

  //           })
  //         }
  //       });
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deletePurchase(result.data.id).then((res: any) => {
  //         this.getpurchaseList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {

  //       })
  //     }
  //   });
  // }

addPurchase(action: string, obj: any) {
  obj.action = action;
  const dialogRef = this.dialog.open(PurchaseMasterDialogComponent, { data: obj });

  dialogRef.afterClosed().subscribe(async (result) => {
    if (!result?.event) return;


    // HELPER FUNCTION: Update stock in Firebase
    const updateStock = async (categoryId: string, countChange: number) => {
      const categoryItem = this.categoryList.find((cat:any) => cat.id === categoryId);
      if (categoryItem) {
        categoryItem.stockCount = (categoryItem.stockCount || 0) + countChange;
        await this.firebaseService.updateCategory(categoryItem.id, categoryItem);
      }
    };

    // ADD PURCHASE
    if (result.event === 'Add') {
      const payload: PurchaseList = {
        id: '',
        billNo: result.data.billNo,
        isParty: result.data.isParty.id,
        date: result.data.date,
        paymentStatus: result.data.paymentStatus,
        total: result.data.total,
        paymentReceived: result.data.paymentReceived,
        companyDetails: result.data.companyDetails.map((detail: any) => ({
          companyName: detail.companyName.id,
          category: detail.category.id,
          purchasePrice: detail.purchasePrice,
          itemCount: detail.itemCount,
          subTotal: detail.subTotal,
        })),
        paymentDetails: result.data.paymentDetails.map((detail: any) => ({
          paymentR: detail.paymentR,
          paymentReceivedDate: detail.paymentReceivedDate
        })),
         userId: localStorage.getItem("userId")
      };

      // Update stock in Firebase
      for (const detail of payload.companyDetails) {
        await updateStock(detail.category, detail.itemCount);
      }

      await this.firebaseService.addPurchase(payload);
      this.getpurchaseList();
      this.openConfigSnackBar('Record created successfully');
    }

    // EDIT PURCHASE
    if (result.event === 'Edit') {
      const oldPurchase = this.purchaseList.find((el:any) => el.id === result.data.id);
      if (!oldPurchase) return;

      // Subtract old itemCount
      for (const oldDetail of oldPurchase.companyDetails) {
        await updateStock(oldDetail.category, -oldDetail.itemCount);
      }

      const payload: PurchaseList = {
        id: result.data.id,
        billNo: result.data.billNo,
        isParty: result.data.isParty.id,
        date: result.data.date,
        // paymentStatus:  result.data.paymentStatus, 
        paymentStatus:  result.data.paymentStatus, 
        total: result.data.total,
        paymentReceived: result.data.paymentReceived,
        companyDetails: result.data.companyDetails.map((detail: any) => ({
          companyName: detail.companyName.id,
          category: detail.category.id,
          purchasePrice: detail.purchasePrice,
          itemCount: detail.itemCount,
          subTotal: detail.subTotal,
        })),
        paymentDetails: result.data.paymentDetails.map((detail: any) => ({
          paymentR: detail.paymentR,
          paymentReceivedDate: detail.paymentReceivedDate
        })),
         userId: localStorage.getItem("userId")
      };

      // Add new itemCount
      for (const detail of payload.companyDetails) {
        await updateStock(detail.category, detail.itemCount);
      }

      await this.firebaseService.updatePurchase(result.data.id, payload);
      this.getpurchaseList();
      this.openConfigSnackBar('Record updated successfully');
    }

    // DELETE PURCHASE
    if (result.event === 'Delete') {
      const oldPurchase = this.purchaseList.find((el:any) => el.id === result.data.id);
      if (!oldPurchase) return;

      // Subtract old itemCount from stock
      for (const detail of oldPurchase.companyDetails) {
        await updateStock(detail.category, -detail.itemCount);
      }

      await this.firebaseService.deletePurchase(result.data.id);
      this.getpurchaseList();
      this.openConfigSnackBar('Record deleted successfully');
    }
  });
}



updateCategory(category: any, data: any) {
  return this.firebaseService.updateCategory(category, data);
}


  viewcompanyDetails(obj: any) {
    const dialogRef = this.dialog.open(ViewcompanyComponent, { data: obj });

  }

  paymentDetails(obj: any) {
    const dialogRef = this.dialog.open(PaymentDetailsComponent, { data: obj });

  }

  getpurchaseList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllPurchase().subscribe((res: any) => {
      if (res) {

        this.purchaseList = res
          .filter((id: any) => id.userId === localStorage.getItem("userId"))
          .map((item: any) => ({
            ...item,
            date: this.parseDate(item.date)
          }));

        this.setPaymentStatus(this.purchaseList)
      }
      this.filterDate();
      this.productDataSource = new MatTableDataSource(this.purchaseList);
      this.productDataSource.paginator = this.paginator;
      this.loaderService.setLoader(false);
    });
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


  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  setPaymentStatus(data: any[]) {
    data.forEach(element => {
      const total = Number(element.total) || 0;
      const received = Number(element.paymentDetails?.[0]?.paymentR) || 0;

      if (total === received && total > 0) {
        element.paymentStatus = 'Paid';
      } else if (received > 0 && received < total) {
        element.paymentStatus = 'Pending';
      } else {
        element.paymentStatus = 'Unpaid';
      }
    });
  }

  getTotalReceived(paymentDetails: any[]): number {
    if (!paymentDetails || paymentDetails.length === 0) {
      return 0;
    }
    return paymentDetails.reduce((sum, item) => sum + (item.paymentR || 0), 0);
  }

   filedownload() {
    const doc: any = new jsPDF();
    doc.setFontSize(13);
    const filteredData: any[] = this.productDataSource.data;

    if (!filteredData || filteredData.length === 0) {
      window.alert("No Shell data available for the selected filters.");
      return;
    }

    const startDate = this.datePurchaseListForm.value.start;
    const endDate = this.datePurchaseListForm.value.end;

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
      "Party Name",
      "Date",
      "Status",
      "Amount Final",
      "Amount Spent",
      "Pending Amount"
    ];

    const data = filteredData.map((item, i) => {
      const partyName = this.partyList.find((prod: any) => prod.id === item.isParty)?.partyName || '';

  const dateStr = moment(item.date).format('DD/MM/YYYY');

  const paymentReceived = item.paymentDetails.reduce(
    (sum: number, pd: any) => sum + (pd.paymentR || 0),
    0
  );

  const totalAmount = item.total || 0;

  const pendingAmount = totalAmount - paymentReceived;
      return [
        i + 1,
        item.billNo,
        partyName,
        dateStr,
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

  fileView(){
     const doc: any = new jsPDF();
    doc.setFontSize(13);
    const filteredData: any[] = this.productDataSource.data;

    if (!filteredData || filteredData.length === 0) {
      window.alert("No Shell data available for the selected filters.");
      return;
    }

    const startDate = this.datePurchaseListForm.value.start;
    const endDate = this.datePurchaseListForm.value.end;

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
      "Party Name",
      "Date",
      "Status",
      "Amount Final",
      "Amount Spent",
      "Pending Amount"
    ];

    const data = filteredData.map((item, i) => {
      const partyName = this.partyList.find((prod: any) => prod.id === item.isParty)?.partyName || '';

  const dateStr = moment(item.date).format('DD/MM/YYYY');

  const paymentReceived = item.paymentDetails.reduce(
    (sum: number, pd: any) => sum + (pd.paymentR || 0),
    0
  );

  const totalAmount = item.total || 0;

  const pendingAmount = totalAmount - paymentReceived;
      return [
        i + 1,
        item.billNo,
        partyName,
        dateStr,
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


    window.open(doc.output("bloburl"))
  }

}

