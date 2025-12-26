import { Injectable } from '@angular/core';
import { addDoc, collectionData, deleteDoc, doc, Firestore,  updateDoc } from '@angular/fire/firestore';
import {  RegisterUser, PartyList, FirmList, PurchaseList, CategoryList, ShellList } from '../interface/invoice';
import { collection } from '@firebase/firestore';
import { Auth } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  constructor(private fService: Firestore, private authentication: Auth) { }


  /////////////////////// registerUser List ////////////////////////


  addUserList(data: RegisterUser) {
    data.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'RegisterUser'), data)
  }

  getUserList() {
    let dataRef = collection(this.fService, 'RegisterUser')
    return collectionData(dataRef, { idField: 'id' })
  }


  /////////////////////// Party List Data ////////////////////////


  addParty(payload: PartyList) {
    payload.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'partyList'), payload)
  }

  getAllParty() {
    let dataRef = collection(this.fService, 'partyList')
    return collectionData(dataRef, { idField: 'id' })
  }

  deleteParty(deleteId: any) {
    let docRef = doc(collection(this.fService, 'partyList'), deleteId);
    return deleteDoc(docRef)
  }

  updateParty(updateId: PartyList, payload: any) {
    let dataRef = doc(this.fService, `partyList/${updateId}`);
    return updateDoc(dataRef, payload)
  }



  /////////////////////// Purchase List Data ////////////////////////


  addPurchase(payload: PurchaseList) {
    payload.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'purchaseList'), payload)
  }

  getAllPurchase() {
    let dataRef = collection(this.fService, 'purchaseList')
    return collectionData(dataRef, { idField: 'id' })
  }

  deletePurchase(deleteId: any) {
    let docRef = doc(collection(this.fService, 'purchaseList'), deleteId);
    return deleteDoc(docRef)
  }

  updatePurchase(updateId: PurchaseList, payload: any) {
    let dataRef = doc(this.fService, `purchaseList/${updateId}`);
    return updateDoc(dataRef, payload)
  }


  
  ///////////////////////  Firm List Data ////////////////////////


  addFirm(payload: FirmList) {
    payload.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'firmList'), payload)
  }

  getAllFirm() {
    let dataRef = collection(this.fService, 'firmList')
    return collectionData(dataRef, { idField: 'id' })
  }

  updateFirm(updateId: FirmList, payload: any) {
    let dataRef = doc(this.fService, `firmList/${updateId}`);
    return updateDoc(dataRef, payload)
  }

  deleteFirm(deleteId: any) {
    let docRef = doc(collection(this.fService, 'firmList'), deleteId);
    return deleteDoc(docRef)
  }


    /////////////////////// Category List Data ////////////////////////


  addCategory(payload: CategoryList) {
    payload.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'categoryList'), payload)
  }

  getAllCategory() {
    let dataRef = collection(this.fService, 'categoryList')
    return collectionData(dataRef, { idField: 'id' })
  }

  deleteCategory(deleteId: any) {
    let docRef = doc(collection(this.fService, 'categoryList'), deleteId);
    return deleteDoc(docRef)
  }

  updateCategory(updateId: CategoryList, payload: any) {
    let dataRef = doc(this.fService, `categoryList/${updateId}`);
    return updateDoc(dataRef, payload)
  }


    /////////////////////// shell List Data ////////////////////////


  addShell(payload: ShellList) {
    payload.id = doc(collection(this.fService, 'id')).id
    return addDoc(collection(this.fService, 'shellList'), payload)
  }

  getAllShell() {
    let dataRef = collection(this.fService, 'shellList')
    return collectionData(dataRef, { idField: 'id' })
  }

  deleteShell(deleteId: any) {
    let docRef = doc(collection(this.fService, 'shellList'), deleteId);
    return deleteDoc(docRef)
  }

  updateShell(updateId: ShellList, payload: any) {
    let dataRef = doc(this.fService, `shellList/${updateId}`);
    return updateDoc(dataRef, payload)
  }



   
}




