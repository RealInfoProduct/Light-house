import { AfterViewInit, Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit, AfterViewInit {
  balanceForm: FormGroup
  totalBalance: any = 0
  selectedBankIndex: number | null = null;
  balanceList: any = []

  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator

  constructor(private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService, private _snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.balanceFormList()
  }

  ngAfterViewInit(): void {
    this.getBalanceList()
  }

  balanceFormList() {
    this.balanceForm = this.fb.group({
      cashBalance: [0],
      bankDetails: this.fb.array([this.createBankDetailGroup()])
    })
  }

  createBankDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id || this.generateUniqueId()],
      // selected: [data?.selected || false],
      bankName: [data?.bankName || ''],
      accountHolderName: [data?.accountHolderName || ''],
      mobileNumber: [data?.mobileNumber || '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      balance: [data?.balance || 0]
    });
  }

  generateUniqueId(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }

  get bankDetails(): FormArray {
    return this.balanceForm.get('bankDetails') as FormArray;
  }


  addBankDetail() {
    this.bankDetails.push(this.createBankDetailGroup());
  }

  removeBankDetail(index: number) {
    this.bankDetails.removeAt(index);
    const selectedBank = this.balanceList?.bankDetails?.find((id: any) => id.selected);
    if (!selectedBank) return;
    this.firebaseService.deleteBalance(selectedBank.id).then((res: any) => {
      this.saveBalance();
      this.openConfigSnackBar('Record deleted successfully');
    }, (error) => {
      console.error("Error deleting record:", error);
    });
  }


  saveBalance() {
    const payload = {
      id: this.balanceList?.id || '',
      cashBalance: this.balanceForm.value.cashBalance,
      bankDetails: this.balanceForm.value.bankDetails,
      userId: localStorage.getItem("userId")
    }

    if (this.balanceList?.id) {
      this.firebaseService.updateBalance(payload.id, payload).then(() => {
        this.getBalanceList();
        this.openConfigSnackBar('record update successfully');
      }, (error) => {

      });
    } else {
      this.firebaseService.addBalance(payload).then(() => {
        this.getBalanceList();
        this.openConfigSnackBar('record create successfully');
      }, (error) => {

      });
    }

  }

  getBalanceList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllBalance().subscribe((res: any[]) => {
      const userData = res.find(
        item => item.userId === localStorage.getItem('userId')
      );

      if (userData) {
        this.balanceList = userData;
        this.setFormData(userData);
      }
      let total = 0;
      this.balanceList?.bankDetails?.forEach((bank: any) => {
        total += parseFloat(bank.balance) || 0;
      });

      this.totalBalance = total

      this.loaderService.setLoader(false);
    });
  }


  setFormData(data: any) {
    this.balanceForm.patchValue({
      cashBalance: data.cashBalance || 0
    });

    this.bankDetails.clear();

    if (data.bankDetails?.length) {
      data.bankDetails.forEach((bank: any) => {
        this.bankDetails.push(this.createBankDetailGroup(bank));
      });
    } else {
      this.bankDetails.push(this.createBankDetailGroup());
    }
  }



  onCheckboxChange(event: MatCheckboxChange, selectedIndex: number) {
    const bankFormArray = this.balanceForm.get('bankDetails') as FormArray;

    if (event.checked) {
      this.selectedBankIndex = selectedIndex;

      bankFormArray.controls.forEach((ctrl, index) => {
        const isSelected = index === selectedIndex;
        ctrl.get('selected')?.setValue(isSelected, { emitEvent: false });
      });

    } else {
      this.selectedBankIndex = null;

      bankFormArray.controls.forEach(ctrl => {
        ctrl.get('selected')?.setValue(false, { emitEvent: false });
      });
    }
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

}
