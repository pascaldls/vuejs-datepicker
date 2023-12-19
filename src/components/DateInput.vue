<template>
  <div :class="{ 'input-group': bootstrapStyling }">
    <!-- Calendar Button -->
    <span
      v-if="calendarButton"
      class="vdp-datepicker__calendar-button"
      :class="{ 'input-group-prepend': bootstrapStyling }"
      @click="showCalendar"
      v-bind:style="{ 'cursor:not-allowed;': disabled }"
    >
      <span :class="{ 'input-group-text': bootstrapStyling }">
        <i :class="calendarButtonIcon">
          {{ calendarButtonIconContent }}
          <span v-if="!calendarButtonIcon">&hellip;</span>
        </i>
      </span>
    </span>
    <!-- Input -->
    <div style="position: relative">
      <input
        :type="inline ? 'hidden' : 'text'"
        :class="computedInputClass"
        :name="name"
        :ref="refName"
        :id="id"
        :value="formattedValue"
        :open-date="openDate"
        :clear-button="clearButton"
        :disabled="disabled"
        :required="required"
        :readonly="!typeable"
        @click="showCalendar"
        @keyup="parseTypedDate"
        @blur="inputBlurred"
        autocomplete="off"
      />
      <label
        ref="referenceLabel"
        style="
          position: absolute;
          pointer-events: none;
          left: -1rem;
          top: 0;
          color: grey;
          opacity: 0.5;
          letter-spacing: 2px;
          white-space: pre;
          margin: 0px;
          line-height: 1em;
        "
      >
        {{ relativeFormat }}
      </label>
    </div>
    <!-- Clear Button -->
    <span
      v-if="clearButton && selectedDate"
      class="vdp-datepicker__clear-button"
      :class="{ 'input-group-append': bootstrapStyling }"
      @click="clearDate()"
    >
      <span :class="{ 'input-group-text': bootstrapStyling }">
        <i :class="clearButtonIcon">
          <span v-if="!clearButtonIcon">&times;</span>
        </i>
      </span>
    </span>
    <slot name="afterDateInput"></slot>
  </div>
</template>
<script>
import moment from "moment";
import { makeDateUtils } from "../utils/DateUtils";
export default {
  props: {
    selectedDate: Date,
    resetTypedDate: [Date],
    format: [String, Function],
    translation: Object,
    inline: Boolean,
    id: String,
    name: String,
    refName: String,
    openDate: Date,
    placeholder: String,
    inputClass: [String, Object, Array],
    clearButton: Boolean,
    clearButtonIcon: String,
    calendarButton: Boolean,
    calendarButtonIcon: String,
    calendarButtonIconContent: String,
    disabled: Boolean,
    required: Boolean,
    typeable: Boolean,
    bootstrapStyling: Boolean,
    useUtc: Boolean,
  },
  data() {
    const constructedDateUtils = makeDateUtils(this.useUtc);
    return {
      input: null,
      typedDate: false,
      utils: constructedDateUtils,
      relativeFormat: "",
    };
  },
  computed: {
    formattedValue() {
      if (!this.selectedDate) {
        return null;
      }
      if (this.typedDate) {
        return this.typedDate;
      }
      return typeof this.format === "function"
        ? this.format(this.selectedDate)
        : this.utils.formatDate(
            new Date(this.selectedDate),
            this.format,
            this.translation
          );
    },
    computedInputClass() {
      if (this.bootstrapStyling) {
        if (typeof this.inputClass === "string") {
          return [this.inputClass, "form-control"].join(" ");
        }
        return { "form-control": true, ...this.inputClass };
      }
      return this.inputClass;
    },
  },
  watch: {
    resetTypedDate( o, n ) {
      this.typedDate = false;
      try {
      n = moment(n).format(this.format);
        this.$nextTick(() => {
          this.input.value = n;
        });
      } catch (error) {
        // console.log(error);
      }
    }, 
    formattedValue() {
      this.$nextTick(() => {
        this.setRelativeFormat();
      });
    },
  },
  methods: {
    showCalendar() {
      this.$emit("showCalendar");
    },
    setRelativeFormat() {
      let format = this.format ; 
      if (typeof this.format === "function") {
        format = this.format() ;
      }
       format = format.toUpperCase();
      let input = this.input || {};
      input = input.value || "";
      input = input.trim();
      if ( input == '0'){ 
        input = '';
      }
      // console.log(input);

      // Create a string with spaces for each character entered
      var filledFormat = " ".repeat(input.length);

      // Append the remaining part of the format
      var remainingFormat = format.substr(input.length);
      var newPlaceholder = filledFormat + remainingFormat;

      this.relativeFormat = newPlaceholder; 
    },
    /**
     * Attempt to parse a typed date
     * @param {Event} event
     */
    cleanDateInput(input, event) {
      let isBackspace = event.key === "Backspace";
      let format = this.format.toLowerCase();
      // Remove invalid characters
      let separator = format.includes("/") ? "/" : "-";
      // Remove invalid characters
      let cleanedInput = input.replace(/[^\d/-]/g, "");
      // Replace multiple slashes or dashes with a single one
      cleanedInput = cleanedInput.replace(/\/\/+/g, "/").replace(/--+/g, "-");
      let formatParts = format.split(separator);
      let formattedDate = "";
      let position = 0;
      let cleanSplit = cleanedInput.split(separator);

      formatParts.forEach((part, index) => {
        if (position < cleanedInput.length) {
          let newText = cleanSplit[index] || "";
          let hasNext = cleanSplit.length > index + 1;
          // Pad month and day with zeros if they are incomplete and there is more input
          if (
            (part === "mm" || part === "dd") &&
            newText.length < 2 &&
            parseInt(newText) > 0 &&
            hasNext
          ) {
            if ( newText == '0'){ 
              newText = '';
            }
            newText = newText.padStart(2, "0");
          }
          // Convert two-digit year to four digits
          if (part === "yyyy" && newText.length === 2) {
            // newText = parseInt(newText) < 50 ? '20' + newText : '19' + newText;
          }
          newText = newText.slice(0, part.length);
          // Add separator if not the last part and currentText is complete
          if (
            index < formatParts.length - 1 &&
            newText &&
            newText.length === part.length &&
            (!isBackspace || hasNext)
          ) {
            newText += separator;
          }

          formattedDate += newText;
          position += newText.length;
        }
      });

      return formattedDate;
    },
    parseTypedDate(event) {
      // close calendar if escape or enter are pressed
      if (
        [
          27, // escape
          13, // enter
        ].includes(event.keyCode)
      ) {
        this.input.blur();
      }

      if (this.typeable) {
        if (this.input.value === "") {
          this.$nextTick(() => {
            this.clearDate();
          });
          return;
        }

        this.input.value = this.cleanDateInput(this.input.value, event); 

        let typedDate;
        /**
         * Identify the correct separator used when
         * separating day, month, and year.
         *
         * Default: "/"
         */
        let separator = [" ", ".", ",", "-", "/"].find((val) => {
          let count = (this.format.match(new RegExp(val, "g")) || []).length;
          return count === 2;
        }, "/");
        let formatParts = this.format.split(separator);
        let dateParts = this.input.value.split(separator);

        /**
         * Get each indexes/sequence for day, month,
         * and year based on the format.
         */
        let indexes = {
          day: formatParts.findIndex((part) => {
            return part.toLowerCase().includes("d");
          }),
          month: formatParts.findIndex((part) => {
            return part.toLowerCase().includes("m");
          }),
          year: formatParts.findIndex((part) => {
            return part.toLowerCase().includes("y");
          }),
        };
        /**
         * Get each length of day, month, and year
         */
        // let len = {
        //   day: formatParts[indexes.day],
        //   month: formatParts[indexes.month],
        //   year: formatParts[indexes.year]
        // }
        /**
         * Get each value of day, month, and year
         */
        let values = {
          day: dateParts[indexes.day] || null,
          month: dateParts[indexes.month || null],
          year: dateParts[indexes.year] || null,
        };

        // console.log( values) ;

        values = {
          day: !isNaN(values.day) ? values.day : null,
          month: !isNaN(values.month) ? values.month : null,
          year: !isNaN(values.year) ? values.year : null,
        };

        // console.log(values);

        /**
         * Default month number format
         */
        let monthNum = values.month - 1;

        /**
         * Only allow if day, month, and year
         * is already been typed.
         */
        // if (values.day && values.month && values.year) {
        /**
         * Check the length of each item (day, month, year)
         * if its the same with the passed format.
         */
        // if (values.day.length === len.day.length && values.month.length === len.month.length && values.year.length === len.year.length) {
        /**
         * We only support until this month format ("MMM").
         * No support yet for month format "MMMM"
         */
        let monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        /**
         * Check once month value is 3 characters in length
         */
        if (values.month && values.month.length === 3) {
          monthNum = monthNames.findIndex((name) => {
            return name === values.month;
          });
        }
        /**
         * Get the unix timestamp of typed date.
         */
        //     typedDate = new Date(values.year, monthNum, values.day).valueOf()
        //   }
        // }

        typedDate = this.selectedDate || new Date();
        if (values.year) {
          if (values.year < 100) {
            let fy = "" + new Date().getFullYear();
            let my = fy.slice(-2);
            let cent = parseInt(fy.slice(0, 2));
            if (values.year < my) {
              values.year = parseInt("".concat(cent, values.year));
            } else {
              values.year = parseInt("".concat(cent - 1, values.year));
            }
          }
          typedDate.setYear(values.year);
        }
        if (values.month && monthNum) {
          typedDate.setMonth(monthNum);
        }
        if (values.day) {
          typedDate.setDate(values.day);
        }

        if (typedDate) {
          this.typedDate = this.input.value;
          this.$emit("typedDate", typedDate);
        }
      }
 
    },
    /**
     * nullify the typed date to defer to regular formatting
     * called once the input is blurred
     */
    inputBlurred() {
      if (typeof this.format === "string" && this.typeable) {
        let mformat = this.format.toUpperCase();
        let d = moment(this.input.value, mformat);
        if (!d.isValid()) {
          this.clearDate();
          this.input.value = null;
          this.typedDate = null;
        }
      } else if (this.typeable && isNaN(Date.parse(this.input.value))) {
        this.clearDate();
        this.input.value = null;
        this.typedDate = null;
      }
      this.$emit("closeCalendar");
    },
    /**
     * emit a clearDate event
     */
    clearDate() {
      this.$emit("clearDate");
    },
  },
  mounted() {
    this.input = this.$el.querySelector("input");

    this.setRelativeFormat();
    this.$nextTick(() => {
      this.setRelativeFormat();
    });
  },
};
// eslint-disable-next-line
</script>
