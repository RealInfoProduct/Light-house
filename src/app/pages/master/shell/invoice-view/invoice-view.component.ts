import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { doc, Firestore, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-invoice-view',
  templateUrl: './invoice-view.component.html',
  styleUrls: ['./invoice-view.component.scss']
})
export class InvoiceViewComponent implements OnInit {

 order: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) return;

    const docRef = doc(this.firestore, `orders/${orderId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      this.order = docSnap.data();
    } else {
      this.order = null;
    }

    this.loading = false;
  }
}