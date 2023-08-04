window.addEventListener("DOMContentLoaded",() => {
	let range1 = new RollCounterRange("#range1"),
		range2 = new RollCounterRange("#range2");
});

class RollCounterRange {
	constructor(id) {
		this.el = document.querySelector(id);
		this.srValue = null;
		this.fill = null;
		this.digitCols = null;
		this.lastDigits = "";
		this.rollDuration = 0; // the transition duration from CSS will override this
		this.trans09 = false;

		if (this.el) {
			this.buildSlider();
			this.el.addEventListener("input",this.changeValue.bind(this));
		}
	}
	buildSlider() {
		// create a div to contain the <input>
		let rangeWrap = document.createElement("div");
		rangeWrap.className = "range";
		this.el.parentElement.insertBefore(rangeWrap,this.el);

		// create another div to contain the <input> and fill
		let rangeInput = document.createElement("span");
		rangeInput.className = "range__input";
		rangeWrap.appendChild(rangeInput);

		// range fill, place the <input> and fill inside container <span>
		let rangeFill = document.createElement("span");
		rangeFill.className = "range__input-fill";
		rangeInput.appendChild(this.el);
		rangeInput.appendChild(rangeFill);

		// create the counter
		let counter = document.createElement("span");
		counter.className = "range__counter";
		rangeWrap.appendChild(counter);

		// screen reader value
		let srValue = document.createElement("span");
		srValue.className = "range__counter-sr";
		srValue.textContent = "0";
		counter.appendChild(srValue);

		// column for each digit
		for (let D of this.el.max.split("")) {
			let digitCol = document.createElement("span");
			digitCol.className = "range__counter-column";
			digitCol.setAttribute("aria-hidden","true");
			counter.appendChild(digitCol);

			// digits (blank, 0–9, fake 0)
			for (let d = 0; d <= 11; ++d) {
				let digit = document.createElement("span");
				digit.className = "range__counter-digit";

				if (d > 0)
					digit.textContent = d == 11 ? 0 : `${d - 1}`;

				digitCol.appendChild(digit);
			}
		}

		this.srValue = srValue;
		this.fill = rangeFill;
		this.digitCols = counter.querySelectorAll(".range__counter-column");
		this.lastDigits = this.el.value;

		while (this.lastDigits.length < this.digitCols.length)
			this.lastDigits = " " + this.lastDigits;

		this.changeValue();

		// use the transition duration from CSS
		let colCS = window.getComputedStyle(this.digitCols[0]),
			transDur = colCS.getPropertyValue("transition-duration"),
			msLabelPos = transDur.indexOf("ms"),
			sLabelPos = transDur.indexOf("s");

		if (msLabelPos > -1)
			this.rollDuration = transDur.substr(0,msLabelPos);
		else if (sLabelPos > -1)
			this.rollDuration = transDur.substr(0,sLabelPos) * 1e3;
	}
	changeValue() {
		// keep the value within range
		if (+this.el.value > this.el.max)
			this.el.value = this.el.max;

		else if (+this.el.value < this.el.min)
			this.el.value = this.el.min;

		// update the screen reader value
		if (this.srValue)
			this.srValue.textContent = this.el.value;

		// width of fill
		if (this.fill) {
			let pct = this.el.value / this.el.max,
				fillWidth = pct * 100,
				thumbEm = 1 - pct;

			this.fill.style.width = `calc(${fillWidth}% + ${thumbEm}em)`;
		}
		
		if (this.digitCols) {
			let rangeVal = this.el.value;

			// add blanks at the start if needed
			while (rangeVal.length < this.digitCols.length)
				rangeVal = " " + rangeVal;

			// get the differences between current and last digits
			let diffsFromLast = [];
			if (this.lastDigits) {
				rangeVal.split("").forEach((r,i) => {
					let diff = +r - this.lastDigits[i];
					diffsFromLast.push(diff);
				});
			}

			// roll the digits
			this.trans09 = false;
			rangeVal.split("").forEach((e,i) => {
				let digitH = 1.5,
					over9 = false,
					under0 = false,
					transY = e === " " ? 0 : (-digitH * (+e + 1)),
					col = this.digitCols[i];

				// start handling the 9-to-0 or 0-to-9 transition
				if (e == 0 && diffsFromLast[i] == -9) {
					transY = -digitH * 11;
					over9 = true;

				} else if (e == 9 && diffsFromLast[i] == 9) {
					transY = 0;
					under0 = true;
				}

				col.style.transform = `translateY(${transY}em)`;
				col.firstChild.textContent = "";

				// finish the transition
				if (over9 || under0) {
					this.trans09 = true;
					// add a temporary 9
					if (under0)
						col.firstChild.textContent = e;

					setTimeout(() => {
						if (this.trans09) {
							let pauseClass = "range__counter-column--pause",
								transYAgain = -digitH * (over9 ? 1 : 10);

							col.classList.add(pauseClass);
							col.style.transform = `translateY(${transYAgain}em)`;
							void col.offsetHeight;
							col.classList.remove(pauseClass);

							// remove the 9
							if (under0)
								col.firstChild.textContent = "";
						}

					},this.rollDuration);
				}
			});
			this.lastDigits = rangeVal;
		}
	}
}