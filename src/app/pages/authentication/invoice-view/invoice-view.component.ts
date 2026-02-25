import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { doc, Firestore, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-invoice-view',
  templateUrl: './invoice-view.component.html',
  styleUrls: ['./invoice-view.component.scss']
})
export class InvoiceViewComponent implements OnInit {

 order: any;
  loading = true;
  firmList: any = []
  categoryList: any[] = []
  shellList: any[] = []

  constructor(
    private route: ActivatedRoute,
     private firebaseService: FirebaseService,
        private loaderService: LoaderService,
    // private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.getFirmList();
    this.getCategoryList(); 
    this.getShellList(); 
//     const orderId = this.route.snapshot.paramMap.get('id');
// console.log(orderId);

    // if (!orderId) return;

    // const docRef = doc(this.firestore, `orders/${orderId}`);
    // const docSnap = await getDoc(docRef);

    // if (docSnap.exists()) {
    //   this.order = docSnap.data();
    // } else {
    //   this.order = null;
    // }

    // this.loading = false;
  }

  getFinalfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.header || '';
  }

  getFinalsubHeaderfirm(firmId: any) {
    return this.firmList.find((c: any) => c.id === firmId)?.subHeader || '';
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

    getFirmList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllFirm().subscribe((res: any) => {
      if (res) {
        this.firmList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
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


 getShellList() {
  this.loaderService.setLoader(true);
  // Get the ID from route parameters
  const orderId = this.route.snapshot.paramMap.get('id');
  console.log('Order ID:', orderId);

  // Fetch all shell data from Firebase
  this.firebaseService.getAllShell().subscribe((res: any) => {
    if (res) {
      // Filter by both userId and the specific orderId
      this.shellList = res.filter(
        (item: any) =>
          item.userId === localStorage.getItem('userId') &&
          item.id === orderId
      );

      // Pass filtered data to generatePDFBlob
      // this.generatePDFBlob(this.shellList);
       if (this.shellList.length > 0) {
      const pdfBlob = this.generatePDFBlob(this.shellList);

      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      // Optionally revoke the object URL after a short delay
      // setTimeout(() => URL.revokeObjectURL(url), 10);
    } else {
      console.warn('No shell items found for this order.');
    }

      this.loaderService.setLoader(false);
    }
  });
}

    generatePDFBlob(item: any): Blob {
    const doc = new jsPDF('p', 'mm', 'a4');
    const firm = this.firmList.find((f: any) => f.id === item[0].firmName);
    console.log(firm);
    
    
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
    const firmTitle = `${this.getFinalfirm(item[0].firmName) || ''} ${this.getFinalsubHeaderfirm(item[0].firmName) || ''}`.toUpperCase();
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
    doc.text(`${item[0].invoiceNo}`, 195, currentY, { align: 'right' });

    doc.text('Bill No:', 155, currentY + 6);
    doc.text(` ${item[0].billNumber}`, 195, currentY + 6, { align: 'right' });

    doc.text('Date:', 155, currentY + 12);
    doc.text(moment(item[0].date).format('DD/MM/YYYY'), 195, currentY + 12, { align: 'right' });

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
    doc.text(`Name: ${item[0].customerName}`, 10, currentY + 7);
    doc.text(`Address: ${item[0].customerAddress || 'No address provided'}`, 10, currentY + 13);
    doc.text(`Mobile: ${item[0].mobileNumber || 'N/A'}`, 10, currentY + 19);

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
    const body = item[0].shellDetails.map((row: any, i: number) => [
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
      item[0].paymentDetails?.reduce(
        (sum: number, p: any) => sum + (Number(p.paymentR) || 0),
        0
      ) || 0;

    const pendingAmount = (item[0].grandTotal || 0) - receivedAmount;

    doc.setFillColor(245, 247, 250);
    doc.rect(120, tableEndY, 80, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 160, tableEndY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text('Total:', 125, tableEndY + 16);
    doc.text(String(item[0].total), 195, tableEndY + 16, { align: 'right' });

    doc.text('Discount:', 125, tableEndY + 22);
    doc.text(String(item[0].extraDiscount), 195, tableEndY + 22, { align: 'right' });

    doc.text('Final Amount:', 125, tableEndY + 28);
    doc.text(String(item[0].grandTotal), 195, tableEndY + 28, { align: 'right' });

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