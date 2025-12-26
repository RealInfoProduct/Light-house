import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { NgFor } from '@angular/common';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { TranslateService } from '@ngx-translate/core';

interface topcards {
  id: number;
  img: string;
  color: string;
  title: string;
  subtitle: any;
}

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [MaterialModule, NgFor],
  templateUrl: './top-cards.component.html',
})
export class AppTopCardsComponent implements OnInit{
  topcards: topcards[] = [
    {
      id: 1,
      color: 'primary',
      img: '/assets/images/svgs/icon-user-male.svg',
      title: 'Total Firm',
      subtitle: 0,
    },
    {
      id: 2,
      color: 'warning',
      img: '/assets/images/svgs/icon-briefcase.svg',
      title: 'Total Party',
      subtitle: 0,
    },
    {
      id: 3,
      color: 'accent',
      img: '/assets/images/svgs/icon-mailbox.svg',
      title: 'Total Invoice',
      subtitle: 0,
    },
    {
      id: 4,
      color: 'error',
      img: '/assets/images/svgs/icon-favorites.svg',
      title: 'Pending Bills',
      subtitle: 0,
    },
    {
      id: 5,
      color: 'success',
      img: '/assets/images/svgs/icon-speech-bubble.svg',
      title: 'Ava. Balance',
      subtitle: 0,
    },
    {
      id: 6,
      color: 'accent',
      img: '/assets/images/svgs/icon-connect.svg',
      title: 'Total Product',
      subtitle: 0,
    },
  ];

  firmList:any [] =[];
  partyList :any [] =[];
  shellList :any [] =[];

  constructor(private firebaseService : FirebaseService, private loaderService : LoaderService , private translate : TranslateService){
    
    this.loaderService.setLoader(true)
    this.translate.get('dashboard').subscribe((res: any) => {
      this.topcards[0].title = res[0].TotalFirm
      this.topcards[1].title = res[1].TotalParty
      this.topcards[5].title = res[4].TotalProduct
      this.topcards[2].title = res[2].TotalInvoice
      this.topcards[3].title = res[3].PendingBills
    })
    this.loaderService.setLoader(false)

  }

  ngOnInit(): void {
      this.getFirmList();
      this.getPartyList();
      this. getShellList(); 
  }

    getFirmList() {
      this.loaderService.setLoader(true)
      this.firebaseService.getAllFirm().subscribe((res: any) => {
        if (res) {
          this.firmList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
          this.topcards[0].subtitle = this.firmList.length;
          this.loaderService.setLoader(false)
        }
      })
    }
    
    getPartyList() {
      this.loaderService.setLoader(true)
      this.firebaseService.getAllParty().subscribe((res: any) => {
        if (res) {
          this.partyList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
          this.topcards[1].subtitle = this.partyList.length;
          console.log(this.partyList.length)
            this.loaderService.setLoader(false)
          }
        })
      }


        getShellList() {
          this.loaderService.setLoader(true)
          this.firebaseService.getAllShell().subscribe((res: any) => {
            if (res) {
              this.shellList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
                 this.topcards[2].subtitle = this.shellList.length;
            }
            this.loaderService.setLoader(false)
      
          })
        }
}
