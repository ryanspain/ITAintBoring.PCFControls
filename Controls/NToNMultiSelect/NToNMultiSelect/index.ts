import {IInputs, IOutputs} from "./generated/ManifestTypes";
import { Select2 } from "select2";
import * as $ from 'jquery';
import "./scripts/select2.min.js";

declare var Xrm: any;

export class NToNMultiSelect implements ComponentFramework.StandardControl<IInputs, IOutputs> {


	private contextObj: ComponentFramework.Context<IInputs>;
    // Div element created as part of this control's main container
	private mainContainer: HTMLSelectElement;
	private selectedItems: string[] = [];
	
	private _linkedEntityName: string;
	private _relationshipEntity: string;
	private _relationshipName: string; 
	private _idAttribute: string;
	private _nameAttribute: string;

	private _linkedEntityCollectionName: string;
	private _mainEntityCollectionName: string;
	
	private _entityMetadataSuccessCallback: any;
	private _linkedEntityMetadataSuccessCallback: any;
	private _relationshipSuccessCallback: any;
	private _successCallback : any;

	private _ctrlId : string;

	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}


	public S4() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
	}

	public newGuid(){
		var result : string = (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0,3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
	    return result;
	}
	 
	// then to call it, plus stitch in '4' in the third group
	
	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		this.contextObj = context;
		this._ctrlId = this.newGuid();
		debugger;
		
		if(context.parameters.linkedEntityName.raw != null)
		  this._linkedEntityName = context.parameters.linkedEntityName.raw;
		if(context.parameters.idAttribute.raw != null)
		  this._idAttribute = context.parameters.idAttribute.raw;
		if(context.parameters.nameAttribute.raw != null)
	      this._nameAttribute = context.parameters.nameAttribute.raw;
	    if(context.parameters.relationshipEntity.raw != null)
	      this._relationshipEntity = context.parameters.relationshipEntity.raw;
        if(context.parameters.relationshipName.raw != null)
	      this._relationshipName = context.parameters.relationshipName.raw;
		
		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
        context.mode.trackContainerResize(true);
        // Create main table container div. 
		this.mainContainer = document.createElement("select");
		this.mainContainer.id = this._ctrlId;
        this.mainContainer.classList.add("js-example-basic-multiple");
		this.mainContainer.multiple = true;
		this.mainContainer.name = "states[]";
		container.appendChild(this.mainContainer);

		

		this._entityMetadataSuccessCallback = this.entityMetadataSuccessCallback.bind(this);
		this._linkedEntityMetadataSuccessCallback = this.linkedEntityMetadataSuccessCallback.bind(this);
		this._relationshipSuccessCallback = this.relationshipSuccessCallback.bind(this);
		this._successCallback = this.successCallback.bind(this);
		
		
		(<any>Xrm).Utility.getEntityMetadata((<any>this.contextObj).page.entityTypeName,[]).then(this._entityMetadataSuccessCallback, this.errorCallback);
		(<any>Xrm).Utility.getEntityMetadata(this._linkedEntityName,[]).then(this._linkedEntityMetadataSuccessCallback, this.errorCallback);
		//(<any>Xrm).WebApi.retrieveMultipleRecords(this._relationshipEntity, "?$filter="+ (<any>this.contextObj).page.entityTypeName+"id eq " + (<any>this.contextObj).page.entityId, 5000).then(this._relationshipSuccessCallback, this.errorCallback);
		this.contextObj.webAPI.retrieveMultipleRecords(this._relationshipEntity, "?$filter="+ (<any>this.contextObj).page.entityTypeName+"id eq " + (<any>this.contextObj).page.entityId, 5000).then(this._relationshipSuccessCallback, this.errorCallback);

		var thisVar : any;
		thisVar = this;
		$(document).ready(function() {
			$('#'+ thisVar._ctrlId).select2().on('select2:select', function (e) {
				var data = e.params.data;
				thisVar.selectAction("select", data.id);
			  }).on('select2:unselect', function (e) {
				var data = e.params.data;
				thisVar.selectAction("unselect", data.id);
			});
		});
	}

	public entityMetadataSuccessCallback(value: any) : void | PromiseLike<void>
	{
		this._mainEntityCollectionName = value.EntitySetName;
	}
	
	public linkedEntityMetadataSuccessCallback(value: any) : void | PromiseLike<void>
	{
		this._linkedEntityCollectionName = value.EntitySetName;
	}
	
	public addOptions(value: any)
	{
		for(var i in value.entities)
		{
			var current : any = value.entities[i];

			var checked = this.selectedItems.indexOf(<string>current[this._idAttribute]) > -1;
			var newOption = new Option(current[this._nameAttribute], current[this._idAttribute], checked, checked);
	        $('#'+ this._ctrlId).append(newOption);
	/*
			var option = document.createElement("option");
			option.value = current[this._idAttribute];
			option.text = current[this._nameAttribute];
			this.mainContainer.options.add(option);
		*/
		}
/*
		var thisVar : any = this;

		setTimeout(function(){ 
			for(var si in thisVar.selectedItems){
				var sel : any = thisVar.selectedItems[si];
				$('#'+ thisVar._ctrlId).val(sel);
			}
		}, 200);
		*/
	}

	public successCallback(value: any) : void | PromiseLike<void>
	{
		this.addOptions(value);
		//this.initTree();
				
	}	


	public relationshipSuccessCallback(value: any) : void | PromiseLike<void>
	{
		for(var i in value.entities)
		{
			this.selectedItems.push(value.entities[i][this._idAttribute]);
		}
  		this.contextObj.webAPI.retrieveMultipleRecords(this._linkedEntityName, "?$orderby=" + this._nameAttribute + " asc", 5000).then(this._successCallback, this.errorCallback);
	}

	public errorCallback(value: any)
	{
		alert(value);
	}	

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		// Add code to update control view
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}

	public selectAction(action : string, id : string)
	{
		/*
		function (e: any, data: any) {
					ProcessClick(
					alert("Checked: " + data.node.id);
					alert("Parent: " + data.node.parent); 
					//alert(JSON.stringify(data));
				}
		*/
		var url: string = (<any>Xrm).Utility.getGlobalContext().getClientUrl();
		var recordUrl: string = url + "/api/data/v9.1/"+ this._mainEntityCollectionName + "(" + (<any>this.contextObj).page.entityId + ")";
		
		if(action == "select")
		{
			//See himbap samples here: http://himbap.com/blog/?p=2063
			var associate = {
				"@odata.id": recordUrl
			};
			
			var req = new XMLHttpRequest();
			req.open("POST", url + "/api/data/v9.1/"+ this._linkedEntityCollectionName +"(" + id + ")/" + this._relationshipName + "/$ref", true);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.onreadystatechange = function() {
				if (this.readyState == 4 /* complete */ ) {
					req.onreadystatechange = null;
					if (this.status == 204) {
						//alert('Record Associated');
					} else {
						var error = JSON.parse(this.response).error;
						alert(error.message);
					}
				}
			};
			req.send(JSON.stringify(associate));
	
		}
		else if(action == "unselect")
		{
			var req = new XMLHttpRequest();
			req.open("DELETE",url + "/api/data/v9.1/"+ this._linkedEntityCollectionName +"(" + id + ")/" + this._relationshipName + "/$ref"+"?$id="+recordUrl, true);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.onreadystatechange = function() {
				if (this.readyState == 4 /* complete */ ) {
					req.onreadystatechange = null;
					if (this.status == 204) {
						//alert('Record Disassociated');
					} else {
						var error = JSON.parse(this.response).error;
						alert(error.message);
					}
				}
			};
			req.send();
		}
		
	}

}