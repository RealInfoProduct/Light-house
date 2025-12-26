import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-category-master-dialog',
  templateUrl: './category-master-dialog.component.html',
  styleUrls: ['./category-master-dialog.component.scss']
})
export class CategoryMasterDialogComponent  implements OnInit {
  categoryForm: FormGroup;
  action: string;
  local_data: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CategoryMasterDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm()
    if (this.action === 'Edit') {
      this.categoryForm.controls['category'].setValue(this.local_data.category)
      this.categoryForm.controls['companyName'].setValue(this.local_data.companyName)
      this.categoryForm.controls['mode'].setValue(this.local_data.mode)
      this.categoryForm.controls['keySpecifiCations'].setValue(this.local_data.keySpecifiCations)
      this.categoryForm.controls['warrantyPeriods'].setValue(this.local_data.warrantyPeriods)
      this.categoryForm.controls['stockCount'].setValue(this.local_data.stockCount)
    }
    
  }

  buildForm() {
    this.categoryForm = this.fb.group({
      category: [''],
      companyName: [''],
      mode: [''],
      keySpecifiCations: [''],
      warrantyPeriods: [''],
      stockCount: [0],
    })
  }

  categoryPayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      category: this.categoryForm.value.category,
      companyName: this.categoryForm.value.companyName,
      mode: this.categoryForm.value.mode,
      keySpecifiCations: this.categoryForm.value.keySpecifiCations,
      warrantyPeriods: this.categoryForm.value.warrantyPeriods,
      stockCount: this.categoryForm.value.stockCount,
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  
  
}