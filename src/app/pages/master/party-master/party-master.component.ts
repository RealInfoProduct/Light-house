import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { PartyList } from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-party-master',
  templateUrl: './party-master.component.html',
  styleUrls: ['./party-master.component.scss']
})
export class PartyMasterComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'PartyName',
    'PartyGSTIN',
    'Address',
    'PartyPan',
    'action',
  ];
  partyList :any = []
  
  partyDataSource = new MatTableDataSource(this.partyList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog , 
    private firebaseService : FirebaseService , 
    private loaderService : LoaderService,
    private _snackBar: MatSnackBar,) { }


  ngOnInit(): void {
  this.getPartyList()
  }

  applyFilter(filterValue: string): void {
    this.partyDataSource.filter = filterValue.trim().toLowerCase();
  }
  
  addParty(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(partyMasterDialogComponent, { data: obj });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: PartyList = {
          id: '',
          partyName: result.data.partyName,
          partyAddress: result.data.partyAddress,
          partyGstNo: result.data.partyGSTIN,
          partyPanNo: result.data.partyPanNo,
          partyMobileNo: result.data.partyMobile,
          isFirm : result.data.isFirm.id,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addParty(payload).then((res) => {
          if (res) {
              this.getPartyList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
         
        })
      }
      if (result?.event === 'Edit') {
        this.partyList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: PartyList = {
              id: result.data.id,
              partyName: result.data.partyName,
              partyAddress: result.data.partyAddress,
              partyGstNo: result.data.partyGSTIN,
              partyPanNo: result.data.partyPanNo,
              partyMobileNo: result.data.partyMobile,
              isFirm : result.data.isFirm.id,
              userId : localStorage.getItem("userId")
            }
              this.firebaseService.updateParty(result.data.id , payload).then((res:any) => {
                  this.getPartyList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
            
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteParty(result.data.id).then((res:any) => {
            this.getPartyList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
         
        })
      }
    });
  }

  getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.partyDataSource = new MatTableDataSource(this.partyList);
        this.partyDataSource.paginator = this.paginator;
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
}


@Component({
  selector: 'app-party-master-dialog',
  templateUrl: 'party-master-dialog.html',
  styleUrls: ['./party-master.component.scss']
})

export class partyMasterDialogComponent implements OnInit {
  partyForm: FormGroup;
  action: string;
  local_data: any;
  firmList: any = []

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<partyMasterDialogComponent>,
    private firebaseService : FirebaseService , 
    private loaderService : LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm()
    this.getFirmList()
    if (this.action === 'Edit') {
      this.partyForm.controls['partyName'].setValue(this.local_data.partyName)
      this.partyForm.controls['partyAddress'].setValue(this.local_data.partyAddress)
      this.partyForm.controls['partyGSTIN'].setValue(this.local_data.partyGstNo)
      this.partyForm.controls['partyPanNo'].setValue(this.local_data.partyPanNo)
      this.partyForm.controls['partyMobile'].setValue(this.local_data.partyMobileNo)
      this.partyForm.controls['isFirm'].setValue(this.local_data.isFirm.id)
    }
  
  }

  buildForm() {
    this.partyForm = this.fb.group({
      partyName: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      partyAddress: [''],
      partyGSTIN: ['', [Validators.pattern('^([0-3][0-9])([A-Z]{5}[0-9]{4}[A-Z])([1-9A-Z])Z([0-9A-Z])$')]],
      partyPanNo: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      partyMobile: ['', [Validators.required,Validators.pattern(/^\d{10}$/)]],
      isFirm : []
    })
  }

  partyPayload(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      partyName: this.partyForm.value.partyName,
      partyAddress: this.partyForm.value.partyAddress,
      partyGSTIN: this.partyForm.value.partyGSTIN,
      partyPanNo: this.partyForm.value.partyPanNo,
      partyMobile: this.partyForm.value.partyMobile,
      isFirm : this.partyForm.value.isFirm
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  // getFirmList() {
  //   this.loaderService.setLoader(true)
  //   this.firebaseService.getAllFirm().subscribe((res: any) => {
  //     if (res) {
  //       this.firmList = res.filter((firm: any) => firm.userId === localStorage.getItem("userId"));
  
  //       if (this.action === 'Edit') {
  //         const selectedFirm = this.firmList.find((firm: any) => firm.id === this.local_data.isFirm);
  //         if (selectedFirm) {
  //           this.partyForm.controls['isFirm'].setValue(selectedFirm);
  //         }
  //       }
  //     }
  //     this.loaderService.setLoader(false);
  //   });
  // }
  
  getFirmList() {
  this.loaderService.setLoader(true);

  this.firebaseService.getAllFirm().subscribe((res: any) => {
    if (res) {
      this.firmList = res.filter((firm: any) =>
        firm.userId === localStorage.getItem("userId")
      );

      this.firmList = this.firmList.filter(
        (item:any, index:any, self:any) =>
          index === self.findIndex((t:any) => t.header === item.header)
      );

      if (this.action === 'Edit') {
        const selectedFirm = this.firmList.find(
          (firm: any) => firm.id === this.local_data.isFirm
        );
        if (selectedFirm) {
          this.partyForm.controls['isFirm'].setValue(selectedFirm);
        }
      }
    }

    this.loaderService.setLoader(false);
  });
}

}