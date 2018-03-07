import { Directive, OnChanges, OnDestroy, Input, Output, EventEmitter,
  HostListener, ApplicationRef, ComponentRef, ElementRef, ViewContainerRef,
  Injector, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';

import { ColorPickerService } from './color-picker.service';
import { ColorPickerComponent } from './color-picker.component';

@Directive({
  selector: '[colorPicker]'
})
export class ColorPickerDirective implements OnChanges, OnDestroy {
  private dialog: any;

  private dialogCreated: boolean = false;
  private ignoreChanges: boolean = false;

  private cmpRef: ComponentRef<ColorPickerComponent>;

  @Input() colorPicker: string;

  @Input() cpWidth: string = '230px';
  @Input() cpHeight: string = 'auto';

  @Input() cpToggle: boolean = false;

  @Input() cpIgnoredElements: any = [];

  @Input() cpDisableInput: boolean = false;

  @Input() cpAlphaChannel: string = 'enabled';
  @Input() cpOutputFormat: string = 'hex';

  @Input() cpFallbackColor: string = '#fff';

  @Input() cpDialogDisplay: string = 'popup';

  @Input() cpSaveClickOutside: boolean = true;

  @Input() cpUseRootViewContainer: boolean = false;

  @Input() cpPosition: string = 'right';
  @Input() cpPositionOffset: string = '0%';
  @Input() cpPositionRelativeToArrow: boolean = false;

  @Input() cpOKButton: boolean = false;
  @Input() cpOKButtonText: string = 'OK';
  @Input() cpOKButtonClass: string = 'cp-ok-button-class';

  @Input() cpCancelButton: boolean = false;
  @Input() cpCancelButtonText: string = 'Cancel';
  @Input() cpCancelButtonClass: string = 'cp-cancel-button-class';

  @Input() cpPresetLabel: string = 'Preset colors';
  @Input() cpPresetColors: string[];
  @Input() cpMaxPresetColorsLength: number = 6;

  @Input() cpPresetEmptyMessage: string = 'No colors added';
  @Input() cpPresetEmptyMessageClass: string = 'preset-empty-message';

  @Input() cpAddColorButton: boolean = false;
  @Input() cpAddColorButtonText: string = 'Add color';
  @Input() cpAddColorButtonClass: string = 'cp-add-color-button-class';

  @Input() cpRemoveColorButtonClass: string = 'cp-remove-color-button-class';

  @Output() cpInputChange = new EventEmitter<any>(true);

  @Output() cpToggleChange = new EventEmitter<boolean>(true);

  @Output() cpSliderChange = new EventEmitter<any>(true);
  @Output() cpSliderDragEnd = new EventEmitter<string>(true);
  @Output() cpSliderDragStart = new EventEmitter<string>(true);

  @Output() cpPresetColorsChange = new EventEmitter<any>(true);

  @Output() colorPickerCancel = new EventEmitter<string>(true);
  @Output() colorPickerSelect = new EventEmitter<string>(true);
  @Output() colorPickerChange = new EventEmitter<string>(false);

  @HostListener('click', ['$event']) handleClick(event: any) {
    this.inputFocus();
  }

  @HostListener('focus', ['$event']) handleFocus(event: any) {
    this.inputFocus();
  }

  @HostListener('input', ['$event']) handleInput(event: any) {
    this.inputChange(event.target.value);
  }

  constructor(private injector: Injector, private cfr: ComponentFactoryResolver,
    private appRef: ApplicationRef, private vcRef: ViewContainerRef, private elRef: ElementRef,
    private _service: ColorPickerService) {}

  ngOnDestroy() {
    if (this.cmpRef !== undefined) {
      this.cmpRef.destroy();
    }
  }

  ngOnChanges(changes: any) {
    if (changes.cpToggle) {
      if (changes.cpToggle.currentValue) {
        this.openDialog();
      }

      if (!changes.cpToggle.currentValue && this.dialog) {
        this.dialog.closeDialog();
      }
    }

    if (changes.colorPicker) {
      if (this.dialog && !this.ignoreChanges) {
        if (this.cpDialogDisplay === 'inline') {
          this.dialog.setInitialColor(changes.colorPicker.currentValue);
        }

        this.dialog.setColorFromString(changes.colorPicker.currentValue, false);
      }

      this.ignoreChanges = false;
    }

    if (changes.cpPresetLabel || changes.cpPresetColors) {
      if (this.dialog) {
        this.dialog.setPresetConfig(this.cpPresetLabel, this.cpPresetColors);
      }
    }
  }

  public openDialog() {
    if (!this.dialogCreated) {
      let vcRef = this.vcRef;

      this.dialogCreated = true;

      if (this.cpUseRootViewContainer && this.cpDialogDisplay !== 'inline') {
        const classOfRootComponent = this.appRef.componentTypes[0];
        const appInstance = this.injector.get(classOfRootComponent);

        vcRef = appInstance.vcRef || appInstance.viewContainerRef || this.vcRef;

        if (vcRef === this.vcRef) {
          console.warn('You are using cpUseRootViewContainer, ' +
            'but the root component is not exposing viewContainerRef!' +
            'Please expose it by adding \'public vcRef: ViewContainerRef\' to the constructor.');
        }
      }

      const compFactory = this.cfr.resolveComponentFactory(ColorPickerComponent);
      const injector = ReflectiveInjector.fromResolvedProviders([], vcRef.parentInjector);

      this.cmpRef = vcRef.createComponent(compFactory, 0, injector, []);

      this.cmpRef.instance.setupDialog(this, this.elRef, this.colorPicker,
        this.cpWidth, this.cpHeight, this.cpDialogDisplay, this.cpFallbackColor,
        this.cpAlphaChannel, this.cpOutputFormat, this.cpDisableInput,
        this.cpIgnoredElements, this.cpSaveClickOutside, this.cpUseRootViewContainer,
        this.cpPosition, this.cpPositionOffset, this.cpPositionRelativeToArrow,
        this.cpPresetLabel, this.cpPresetColors, this.cpMaxPresetColorsLength,
        this.cpPresetEmptyMessage, this.cpPresetEmptyMessageClass,
        this.cpOKButton, this.cpOKButtonClass, this.cpOKButtonText,
        this.cpCancelButton, this.cpCancelButtonClass, this.cpCancelButtonText,
        this.cpAddColorButton, this.cpAddColorButtonClass, this.cpAddColorButtonText,
        this.cpRemoveColorButtonClass);
        this.dialog = this.cmpRef.instance;

        if (this.vcRef !== vcRef) {
          this.cmpRef.changeDetectorRef.detectChanges();
        }
    } else if (this.dialog) {
      this.dialog.openDialog(this.colorPicker);
    }
  }

  public toggle(value: boolean) {
    this.cpToggleChange.emit(value);
  }

  public colorChanged(value: string, ignore: boolean = true) {
    this.ignoreChanges = ignore;

    this.colorPickerChange.emit(value);
  }

  public colorCanceled() {
    this.colorPickerCancel.emit();
  }

  public colorSelected(value: string) {
    this.colorPickerSelect.emit(value);
  }

  public inputFocus() {
    const element = this.elRef.nativeElement;

    if (this.cpIgnoredElements.filter((item: any) => item === element).length === 0) {
      this.openDialog();
    }
  }

  public inputChange(value: string) {
    if (this.dialog) {
      this.dialog.setColorFromString(value, true);
    } else {
      this.colorPicker = value;

      this.colorPickerChange.emit(this.colorPicker);
    }
  }

  public inputChanged(event: any) {
    this.cpInputChange.emit(event);
  }

  public sliderChanged(event: any) {
    this.cpSliderChange.emit(event);
  }

  public sliderDragEnd(event: any) {
    this.cpSliderDragEnd.emit(event);
  }

  public sliderDragStart(event: any) {
    this.cpSliderDragStart.emit(event);
  }

  public presetColorsChanged(value: any[]) {
    this.cpPresetColorsChange.emit(value);
  }
}
