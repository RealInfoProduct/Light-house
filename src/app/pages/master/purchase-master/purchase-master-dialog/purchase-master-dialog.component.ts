import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-purchase-master-dialog',
  templateUrl: './purchase-master-dialog.component.html',
  styleUrls: ['./purchase-master-dialog.component.scss']
})
export class PurchaseMasterDialogComponent implements OnInit {
  productForm: FormGroup;
  action: string;
  local_data: any;
  partyList: any = []
  categoryList: any = []
  companyList: any[] = [];
  filteredCategoryList: any[] = [];
  paymentExceeded = false;
  pendingAmount: number = 0;

  StatusList: any[] = [
    { type: 'Pending' },
    { type: 'Paid' },
    { type: 'Unpaid' }
  ];
oldCompanyDetails: any[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PurchaseMasterDialogComponent>,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm();
    this.getPartyList();
    this.getCategoryList();
    this.calculatePending();

    if (this.action === 'Edit') {
      this.productForm.patchValue(this.local_data);
      this.local_data.companyDetails.forEach((detail: any, index: number) => {
        if (index > 0) this.addproductDetail();
        const formGroup = this.companyDetails.at(index) as FormGroup;
        if (formGroup) {
          formGroup.patchValue({
            companyName: detail.companyName,
            category: detail.category,
            purchasePrice: detail.purchasePrice,
            itemCount: detail.itemCount,
            subTotal: detail.subTotal,
          });
        }
      });
      this.local_data.paymentDetails.forEach((detail: any, index: number) => {
        if (index > 0) this.addpaymentDetail();

        const formGroup = this.paymentDetails.at(index) as FormGroup;
        if (formGroup) {
          const paymentDate = detail.paymentReceivedDate
            ? new Date(detail.paymentReceivedDate.seconds * 1000)
            : null;

          formGroup.patchValue({
            paymentR: detail.paymentR,
            paymentReceivedDate: paymentDate
          });
        }
      });


    }
    this.productForm.valueChanges.subscribe(() => {
      this.calculatePending();
    });
  //    this.paymentDetails.controls.forEach((group: any) => {
  //   group.get('paymentR')?.valueChanges.subscribe((value: number) => {
  //     if (value > 0) {
  //       this.productForm.get('paymentStatus')?.setValue('Pending');
  //     }
  //     if (value <= 0) {
  //       this.productForm.get('paymentStatus')?.setValue('Unpaid');
  //     }
     
  //   });
  // });

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


  onCompanyChange(index: number) {
    const group = this.companyDetails.at(index) as FormGroup;
    const selectedCompany = group.get('companyName')?.value;

    if (selectedCompany) {
      group.get('category')?.enable();
      group.get('category')?.reset();

      this.filteredCategoryList[index] = this.categoryList.filter(
        (cat: any) => cat.companyName === selectedCompany.companyName
      );
    } else {
      group.get('category')?.reset();
      group.get('category')?.disable();
      this.filteredCategoryList[index] = [];
    }
  }



  buildForm() {
    this.productForm = this.fb.group({
      billNo: [Validators.required],
      isParty: ['', Validators.required],
      paymentStatus: ['Unpaid', Validators.required],
      date: [new Date()],
      total: [0],
      paymentReceived: [false],
      companyDetails: this.fb.array([this.createproductDetailGroup()]),
      paymentDetails: this.fb.array([this.createpaymentDetailGroup()])
    })

    
  }

  createproductDetailGroup(): FormGroup {
    const group = this.fb.group({
      companyName: [''],
      category: [{ value: '', disabled: true }],
      purchasePrice: [0, Validators.required],
      itemCount: [0, Validators.required],
      subTotal: [0]
    });


    group.valueChanges.subscribe(() => {
      this.calculateSubTotal(group);
    });

    return group;
  }

  createpaymentDetailGroup(): FormGroup {
    const group = this.fb.group({
      paymentR: [, Validators.min(0)],
      paymentReceivedDate: [new Date()]
    });
    group.get('paymentR')?.valueChanges.subscribe(() => {
      this.checkPaymentLimit();
    });


    return group;
  }

  getTotalPaymentReceived(): number {
    return this.paymentDetails.controls.reduce((sum, ctrl) => {
      return sum + (Number(ctrl.get('paymentR')?.value) || 0);
    }, 0);
  }

  checkPaymentLimit() {
    const totalPayment = this.getTotalPaymentReceived();
    const grandTotal = Number(this.productForm.get('total')?.value) || 0;
    this.paymentExceeded = totalPayment > grandTotal;
  }

  calculateSubTotal(group: FormGroup) {
    const price = Number(group.get('purchasePrice')?.value) || 0;
    const count = Number(group.get('itemCount')?.value) || 0;

    const subTotal = price * count;

    group.get('subTotal')?.setValue(subTotal, { emitEvent: false });
    this.calculateGrandTotal();
  }

  calculateGrandTotal() {
    const total = this.companyDetails.controls.reduce((sum, ctrl) => {
      const subTotal = Number((ctrl as FormGroup).get('subTotal')?.value) || 0;
      return sum + subTotal;
    }, 0);

    this.productForm.get('total')?.setValue(total, { emitEvent: false });
  }

calculatePending() {
  const grandTotal = Number(this.productForm.get('total')?.value) || 0;

  const paidTotal = this.paymentDetails.controls.reduce((sum, group) => {
    return sum + (Number(group.get('paymentR')?.value) || 0);
  }, 0);

  this.pendingAmount = grandTotal - paidTotal;

  if (this.pendingAmount === 0 && grandTotal > 0) {
    this.productForm.get('paymentStatus')?.setValue('Paid', { emitEvent: false });
  } else if (paidTotal > 0 && this.pendingAmount > 0) {
    this.productForm.get('paymentStatus')?.setValue('Pending', { emitEvent: false });
  } else {
    this.productForm.get('paymentStatus')?.setValue('Unpaid', { emitEvent: false });
  }
}


  removeproductDetail(index: number) {
    this.companyDetails.removeAt(index);
    this.calculateGrandTotal();
  }

  addproductDetail() {
    this.companyDetails.push(this.createproductDetailGroup());
  }

  get companyDetails(): FormArray {
    return this.productForm.get('companyDetails') as FormArray;
  }

  removepaymentDetail(index: number) {
    this.paymentDetails.removeAt(index);
    this.checkPaymentLimit();
  }

  addpaymentDetail() {
    if (this.paymentExceeded) return;
    this.paymentDetails.push(this.createpaymentDetailGroup());
  }

  get paymentDetails(): FormArray {
    return this.productForm.get('paymentDetails') as FormArray;
  }


  purchasePayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      billNo: this.productForm.value.billNo,
      isParty: this.productForm.value.isParty,
      date: this.productForm.value.date,
      paymentStatus: this.productForm.value.paymentStatus,
      total: this.productForm.value.total,
      paymentReceived: this.productForm.value.paymentReceived,
      companyDetails: this.productForm.value.companyDetails,
      paymentDetails: this.productForm.value.paymentDetails
    };
  this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

 
  getCategoryList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter(
          (id: any) => id.userId === localStorage.getItem('userId')
        );

        this.companyList = this.categoryList.filter(
          (item: any, index: any, self: any) =>
            index === self.findIndex((t: any) => t.companyName === item.companyName)
        );

        if (this.action === 'Edit') {
          this.setCompanyAndCategoryEdit();
        }
      }
      this.loaderService.setLoader(false);
    });
  }

   getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((party: any) => party.userId === localStorage.getItem("userId"));

        if (this.action === 'Edit') {
          const selectedparty = this.partyList.find((party: any) => party.id === this.local_data.isParty);
          if (selectedparty) {
            this.productForm.controls['isParty'].setValue(selectedparty);
          }
        }
      }
      this.loaderService.setLoader(false);
    });
  }

  setCompanyAndCategoryEdit() {
    this.local_data.companyDetails.forEach((detail: any, index: number) => {
      const formGroup = this.companyDetails.at(index) as FormGroup;

      const selectedCompany = this.companyList.find(
        (c: any) => c.id === detail.companyName || c.companyName === detail.companyName
      );

      if (selectedCompany) {
        formGroup?.get('companyName')?.setValue(selectedCompany);

        formGroup?.get('category')?.enable();

        this.filteredCategoryList[index] = this.categoryList.filter(
          (cat: any) => cat.companyName === selectedCompany.companyName
        );

        const selectedCategory = this.filteredCategoryList[index].find(
          (cat: any) => cat.id === detail.category || cat.categoryName === detail.category
        );

        if (selectedCategory) {
          formGroup.get('category')?.setValue(selectedCategory);
        }
      }
    });
  }


}