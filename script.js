/**
 * Script.js - Gerador de Recibo de Contracheque (Holerite)
 * Gerencia o estado, escuta entradas do formulário, calcula INSS/IRRF
 * e renderiza dinamicamente as vias do recibo de contracheque.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Gerenciamento de estado - inicializado vazio para preenchimento manual do usuário
    const state = {
        company: {
            name: "",
            address: "",
            cnpj: "",
            code: ""
        },
        employee: {
            code: "",
            name: "",
            role: "",
            pis: "",
            cpf: "",
            setor: "",
            secao: "",
            fi: ""
        },
        bank: {
            name: "",
            ag: "",
            cc: ""
        },
        financials: {
            salaryBase: null,
            salaryRef: null,
            advance: null,
            customDiscount: null
        },
        taxes: {
            autoCalc: true,
            manualInss: null,
            manualIrrf: null
        },
        selectedMonth: "",
        selectedYear: "",
        currentMonth: "",
        excelEmployees: []
    };

    // Elementos do DOM
    const elements = {
        selectMonth: document.getElementById('select-month'),
        selectYear: document.getElementById('select-year'),
        companyName: document.getElementById('company-name'),
        companyAddress: document.getElementById('company-address'),
        companyCnpj: document.getElementById('company-cnpj'),
        companyCode: document.getElementById('company-code'),
        empCode: document.getElementById('emp-code'),
        empName: document.getElementById('emp-name'),
        empRole: document.getElementById('emp-role'),
        empPis: document.getElementById('emp-pis'),
        empCpf: document.getElementById('emp-cpf'),
        empSetor: document.getElementById('emp-setor'),
        empSecao: document.getElementById('emp-secao'),
        empFi: document.getElementById('emp-fi'),
        salaryBase: document.getElementById('salary-base'),
        salaryRef: document.getElementById('salary-ref'),
        advanceValue: document.getElementById('advance-value'),
        customDiscount: document.getElementById('custom-discount'),
        bankName: document.getElementById('bank-name'),
        bankAg: document.getElementById('bank-ag'),
        bankCc: document.getElementById('bank-cc'),
        calcAuto: document.getElementById('calc-auto'),
        manualTaxInputs: document.getElementById('manual-tax-inputs'),
        manualInss: document.getElementById('manual-inss'),
        manualIrrf: document.getElementById('manual-irrf'),
        pagesContainer: document.getElementById('holerite-pages-container'),
        btnPrintCurrent: document.getElementById('btn-print-current'),
        btnPrintAll: document.getElementById('btn-print-all'),
        btnThemeToggle: document.getElementById('btn-theme-toggle'),
        pageTemplate: document.getElementById('holerite-page-template'),
        inputExcelFile: document.getElementById('input-excel-file'),
        btnDownloadTemplate: document.getElementById('btn-download-template'),
        btnGenerateExcelBatch: document.getElementById('btn-generate-excel-batch'),
        btnGenerateExcelText: document.getElementById('btn-generate-excel-text'),
        excelStatus: document.getElementById('excel-status'),
        btnExportExcelZip: document.getElementById('btn-export-excel-zip')
    };

    // Função auxiliar para atualizar a string currentMonth com base no mês e ano selecionados
    function updateCurrentMonthState() {
        if (state.selectedMonth && state.selectedYear) {
            state.currentMonth = `${state.selectedMonth} de ${state.selectedYear}`;
        } else if (state.selectedMonth) {
            state.currentMonth = state.selectedMonth;
        } else if (state.selectedYear) {
            state.currentMonth = state.selectedYear.toString();
        } else {
            state.currentMonth = "";
        }
    }

    // Sincroniza os campos de entrada com os valores do estado
    function syncStateToInputs() {
        elements.selectMonth.value = state.selectedMonth;
        elements.selectYear.value = state.selectedYear;
        elements.companyName.value = state.company.name;
        elements.companyAddress.value = state.company.address;
        elements.companyCnpj.value = state.company.cnpj;
        elements.companyCode.value = state.company.code;
        elements.empCode.value = state.employee.code;
        elements.empName.value = state.employee.name;
        elements.empRole.value = state.employee.role;
        elements.empPis.value = state.employee.pis;
        elements.empCpf.value = state.employee.cpf;
        elements.empSetor.value = state.employee.setor;
        elements.empSecao.value = state.employee.secao;
        elements.empFi.value = state.employee.fi;
        elements.salaryBase.value = state.financials.salaryBase !== null ? state.financials.salaryBase : '';
        elements.salaryRef.value = state.financials.salaryRef !== null ? state.financials.salaryRef : '';
        elements.advanceValue.value = state.financials.advance !== null ? state.financials.advance : '';
        elements.customDiscount.value = state.financials.customDiscount !== null ? state.financials.customDiscount : '';
        elements.bankName.value = state.bank.name;
        elements.bankAg.value = state.bank.ag;
        elements.bankCc.value = state.bank.cc;
        elements.calcAuto.checked = state.taxes.autoCalc;
        elements.manualInss.value = state.taxes.manualInss !== null ? state.taxes.manualInss : '';
        elements.manualIrrf.value = state.taxes.manualIrrf !== null ? state.taxes.manualIrrf : '';
    }

    // Captura as alterações nos campos de entrada e atualiza o estado
    function setupInputListeners() {
        // Ouvidores dos campos de Mês e Ano
        elements.selectMonth.addEventListener('change', (e) => {
            state.selectedMonth = e.target.value;
            updateCurrentMonthState();
            updatePreview();
        });

        elements.selectYear.addEventListener('input', (e) => {
            state.selectedYear = e.target.value;
            updateCurrentMonthState();
            updatePreview();
        });

        const inputMap = [
            { el: elements.companyName, key: 'name', parent: 'company' },
            { el: elements.companyAddress, key: 'address', parent: 'company' },
            { el: elements.companyCnpj, key: 'cnpj', parent: 'company' },
            { el: elements.companyCode, key: 'code', parent: 'company' },
            { el: elements.empCode, key: 'code', parent: 'employee' },
            { el: elements.empName, key: 'name', parent: 'employee' },
            { el: elements.empRole, key: 'role', parent: 'employee' },
            { el: elements.empPis, key: 'pis', parent: 'employee' },
            { el: elements.empCpf, key: 'cpf', parent: 'employee' },
            { el: elements.empSetor, key: 'setor', parent: 'employee' },
            { el: elements.empSecao, key: 'secao', parent: 'employee' },
            { el: elements.empFi, key: 'fi', parent: 'employee' },
            { el: elements.bankName, key: 'name', parent: 'bank' },
            { el: elements.bankAg, key: 'ag', parent: 'bank' },
            { el: elements.bankCc, key: 'cc', parent: 'bank' },
            { el: elements.salaryBase, key: 'salaryBase', parent: 'financials', isFloat: true },
            { el: elements.salaryRef, key: 'salaryRef', parent: 'financials', isFloat: true },
            { el: elements.advanceValue, key: 'advance', parent: 'financials', isFloat: true },
            { el: elements.customDiscount, key: 'customDiscount', parent: 'financials', isFloat: true },
            { el: elements.manualInss, key: 'manualInss', parent: 'taxes', isFloat: true },
            { el: elements.manualIrrf, key: 'manualIrrf', parent: 'taxes', isFloat: true }
        ];

        inputMap.forEach(item => {
            item.el.addEventListener('input', (e) => {
                let val = e.target.value;
                if (item.isFloat) {
                    val = (val === '' || val === null || val === undefined) ? null : parseFloat(val);
                    if (val !== null && Number.isNaN(val)) val = null;
                }
                
                if (item.parent) {
                    state[item.parent][item.key] = val;
                } else {
                    state[item.key] = val;
                }
                
                updatePreview();
            });
        });

        // Alterna os cálculos automáticos
        elements.calcAuto.addEventListener('change', (e) => {
            state.taxes.autoCalc = e.target.checked;
            if (state.taxes.autoCalc) {
                elements.manualTaxInputs.classList.add('hidden');
            } else {
                elements.manualTaxInputs.classList.remove('hidden');
            }
            updatePreview();
        });
    }

    // Faixas progressivas do INSS 2025/2026 (baseado no salário mínimo de R$ 1.518,00)
    function calculateINSS(salario) {
        if (!salario || salario <= 0) return 0;
        const minWage = 1518.00;
        let inss = 0;
        
        if (salario <= minWage) {
            inss = salario * 0.075;
        } else if (salario <= 2793.88) {
            inss = (minWage * 0.075) + ((salario - minWage) * 0.09);
        } else if (salario <= 4190.83) {
            inss = (minWage * 0.075) + ((2793.88 - minWage) * 0.09) + ((salario - 2793.88) * 0.12);
        } else {
            const ceiling = Math.min(salario, 8157.41);
            inss = (minWage * 0.075) + ((2793.88 - minWage) * 0.09) + ((4190.83 - 2793.88) * 0.12) + ((ceiling - 4190.83) * 0.14);
        }
        return Math.round(inss * 100) / 100;
    }

    // Faixas progressivas do IRRF 2025/2026
    function calculateIRRF(baseIrrf) {
        if (!baseIrrf || baseIrrf <= 0) {
            return { value: 0, faixa: 0 };
        }
        
        let tax = 0;
        let faixa = 0;
        
        if (baseIrrf <= 2259.20) {
            tax = 0;
            faixa = 0;
        } else if (baseIrrf <= 2828.65) {
            tax = (baseIrrf * 0.075) - 169.44;
            faixa = 1;
        } else if (baseIrrf <= 3751.05) {
            tax = (baseIrrf * 0.15) - 381.44;
            faixa = 2;
        } else if (baseIrrf <= 4664.68) {
            tax = (baseIrrf * 0.225) - 662.77;
            faixa = 3;
        } else {
            tax = (baseIrrf * 0.275) - 896.00;
            faixa = 4;
        }
        
        return {
            value: Math.max(0, Math.round(tax * 100) / 100),
            faixa: faixa
        };
    }

    // Formata valor monetário no padrão Pt-BR (retorna string vazia se for nulo/indefinido/vazio)
    function formatCurrency(val) {
        if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
            return '';
        }
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    }

    // Preenche os campos de um cartão de holerite (suporta customData opcional para geração em lote por planilha)
    function fillCardFields(card, monthName, customData = null) {
        const company = customData ? customData.company : state.company;
        const employee = customData ? customData.employee : state.employee;
        const bank = customData ? customData.bank : state.bank;
        const financials = customData ? customData.financials : state.financials;
        const taxes = customData ? customData.taxes : state.taxes;
        const periodDisplay = (customData && customData.monthName) ? customData.monthName : (monthName || '');

        // Campos básicos
        card.querySelectorAll('[data-field="company-name"]').forEach(el => el.textContent = company.name);
        card.querySelectorAll('[data-field="company-address"]').forEach(el => el.textContent = company.address);
        card.querySelectorAll('[data-field="company-cnpj"]').forEach(el => el.textContent = company.cnpj);
        card.querySelectorAll('[data-field="company-code"]').forEach(el => el.textContent = company.code);
        
        card.querySelectorAll('[data-field="emp-code"]').forEach(el => el.textContent = employee.code);
        card.querySelectorAll('[data-field="emp-name"]').forEach(el => el.textContent = employee.name);
        card.querySelectorAll('[data-field="emp-role"]').forEach(el => el.textContent = employee.role);
        card.querySelectorAll('[data-field="emp-pis"]').forEach(el => el.textContent = employee.pis);
        card.querySelectorAll('[data-field="emp-cpf"]').forEach(el => el.textContent = employee.cpf);
        card.querySelectorAll('[data-field="emp-setor"]').forEach(el => el.innerHTML = employee.setor || '&nbsp;');
        card.querySelectorAll('[data-field="emp-secao"]').forEach(el => el.innerHTML = employee.secao || '&nbsp;');
        card.querySelectorAll('[data-field="emp-fi"]').forEach(el => el.textContent = employee.fi);
        
        card.querySelectorAll('[data-field="bank-name"]').forEach(el => el.textContent = bank.name);
        card.querySelectorAll('[data-field="bank-ag"]').forEach(el => el.textContent = bank.ag);
        card.querySelectorAll('[data-field="bank-cc"]').forEach(el => el.textContent = bank.cc);
        card.querySelectorAll('[data-field="month-year"]').forEach(el => el.textContent = periodDisplay);

        // Valores financeiros principais
        const baseSalary = financials.salaryBase;
        const refDays = financials.salaryRef;
        const advance = financials.advance;
        const customDiscount = financials.customDiscount;

        // Cálculos de impostos
        let inss = taxes.manualInss;
        let irrf = taxes.manualIrrf;
        let faixaIrrf = 0;

        if (taxes.autoCalc) {
            inss = baseSalary ? calculateINSS(baseSalary) : null;
            const baseIrrfCalc = baseSalary && inss ? Math.max(0, baseSalary - inss) : null;
            if (baseIrrfCalc !== null) {
                const irrfResult = calculateIRRF(baseIrrfCalc);
                irrf = irrfResult.value;
                faixaIrrf = irrfResult.faixa;
            } else {
                irrf = null;
                faixaIrrf = 0;
            }
        }

        // Cálculos para a tabela de lançamentos
        const entries = [];
        if (baseSalary !== null && baseSalary > 0) {
            entries.push({ cod: "1", desc: "Salário base", ref: refDays !== null ? formatCurrency(refDays) : '', venc: baseSalary, desconto: null });
        }
        if (inss !== null && inss > 0) {
            entries.push({ cod: "71", desc: "INSS", ref: "*12,00", venc: null, desconto: inss });
        }
        if (advance !== null && advance > 0) {
            entries.push({ cod: "74", desc: "Adiantamento salarial anterior", ref: "", venc: null, desconto: advance });
        }
        if (customDiscount !== null && customDiscount > 0) {
            entries.push({ cod: "99", desc: "Outros Descontos", ref: "", venc: null, desconto: customDiscount });
        }
        if (irrf !== null && irrf > 0) {
            entries.push({ cod: "72", desc: "IRRF", ref: `${faixaIrrf > 0 ? (faixaIrrf * 7.5).toFixed(1) + '%' : ''}`, venc: null, desconto: irrf });
        }

        // Renderiza o corpo da tabela
        const tbody = card.querySelector('.h-table-body');
        tbody.innerHTML = '';
        
        let totalVenc = 0;
        let totalDesc = 0;
        let hasVenc = false;
        let hasDesc = false;

        entries.forEach(entry => {
            const tr = document.createElement('tr');
            
            const tdCod = document.createElement('td');
            tdCod.className = 'col-cod';
            tdCod.textContent = entry.cod;
            
            const tdDesc = document.createElement('td');
            tdDesc.className = 'col-descricao text-upper';
            tdDesc.textContent = entry.desc;
            
            const tdRef = document.createElement('td');
            tdRef.className = 'col-ref';
            tdRef.textContent = entry.ref;
            
            const tdVenc = document.createElement('td');
            tdVenc.className = 'col-venc text-right';
            tdVenc.textContent = entry.venc !== null ? formatCurrency(entry.venc) : '';
            if (entry.venc !== null) {
                totalVenc += entry.venc;
                hasVenc = true;
            }
            
            const tdDesconto = document.createElement('td');
            tdDesconto.className = 'col-desconto text-right';
            tdDesconto.textContent = entry.desconto !== null ? formatCurrency(entry.desconto) : '';
            if (entry.desconto !== null) {
                totalDesc += entry.desconto;
                hasDesc = true;
            }

            tr.appendChild(tdCod);
            tr.appendChild(tdDesc);
            tr.appendChild(tdRef);
            tr.appendChild(tdVenc);
            tr.appendChild(tdDesconto);
            tbody.appendChild(tr);
        });

        // Preenche a tabela até 9 linhas para manter o tamanho exato do holerite original
        const paddingRows = Math.max(0, 9 - entries.length);
        for (let i = 0; i < paddingRows; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td class="col-cod">&nbsp;</td><td class="col-descricao">&nbsp;</td><td class="col-ref">&nbsp;</td><td class="col-venc">&nbsp;</td><td class="col-desconto">&nbsp;</td>';
            tbody.appendChild(tr);
        }

        // Resumos e totais
        const hasTotals = hasVenc || hasDesc;
        const liquidValue = hasTotals ? (totalVenc - totalDesc) : null;

        card.querySelectorAll('[data-field="total-venc"]').forEach(el => el.textContent = hasVenc ? formatCurrency(totalVenc) : '');
        card.querySelectorAll('[data-field="total-desc"]').forEach(el => el.textContent = hasDesc ? formatCurrency(totalDesc) : '');
        card.querySelectorAll('[data-field="liquid-value"]').forEach(el => el.textContent = liquidValue !== null ? formatCurrency(liquidValue) : '');

        // Bases de cálculo no rodapé
        const baseFgts = (baseSalary !== null && baseSalary > 0) ? baseSalary : null;
        const fgtsMonth = baseFgts !== null ? baseFgts * 0.08 : null;
        let baseIrrfShow = (baseSalary !== null && inss !== null && baseSalary > 0) ? Math.max(0, baseSalary - inss) : null;

        card.querySelectorAll('[data-field="base-salary"]').forEach(el => el.textContent = formatCurrency(baseSalary));
        card.querySelectorAll('[data-field="base-inss"]').forEach(el => el.textContent = formatCurrency(baseSalary));
        card.querySelectorAll('[data-field="base-fgts"]').forEach(el => el.textContent = formatCurrency(baseFgts));
        card.querySelectorAll('[data-field="fgts-month"]').forEach(el => el.textContent = formatCurrency(fgtsMonth));
        card.querySelectorAll('[data-field="base-irrf"]').forEach(el => el.textContent = formatCurrency(baseIrrfShow));
        card.querySelectorAll('[data-field="faixa-irrf"]').forEach(el => el.textContent = (baseSalary && baseSalary > 0) ? faixaIrrf : '');
    }

    // Gera e renderiza as páginas no container DOM
    function updatePreview() {
        elements.pagesContainer.innerHTML = '';
        
        // Renderiza a visualização do mês atual
        const templateContent = elements.pageTemplate.content.cloneNode(true);
        const pageDiv = templateContent.querySelector('.print-page');
        
        // Preenche ambas as vias (Empresa e Funcionário)
        const employerCopy = pageDiv.querySelector('.copy-employer');
        const employeeCopy = pageDiv.querySelector('.copy-employee');
        
        fillCardFields(employerCopy, state.currentMonth);
        fillCardFields(employeeCopy, state.currentMonth);
        
        elements.pagesContainer.appendChild(pageDiv);
    }

    // Gera 12 páginas para impressão em lote com base no mês/ano selecionado
    function generateAllMonthsPages() {
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        
        const targetYear = parseInt(state.selectedYear, 10);
        
        let startIndex = 0;
        if (state.selectedMonth) {
            const idx = monthNames.indexOf(state.selectedMonth);
            if (idx !== -1) startIndex = idx;
        }
        
        elements.pagesContainer.innerHTML = '';
        
        for (let i = 0; i < 12; i++) {
            const monthIdx = (startIndex + i) % 12;
            const yearOffset = Math.floor((startIndex + i) / 12);
            const year = targetYear + yearOffset;
            const monthFormatted = `${monthNames[monthIdx]} de ${year}`;
            
            const templateContent = elements.pageTemplate.content.cloneNode(true);
            const pageDiv = templateContent.querySelector('.print-page');
            
            const employerCopy = pageDiv.querySelector('.copy-employer');
            const employeeCopy = pageDiv.querySelector('.copy-employee');
            
            fillCardFields(employerCopy, monthFormatted);
            fillCardFields(employeeCopy, monthFormatted);
            
            elements.pagesContainer.appendChild(pageDiv);
        }
    }

    // Gera o modelo CSV para os usuários baixarem e preencherem
    function downloadCsvTemplate() {
        const headers = [
            "RazaoSocial", "Endereco", "CNPJ", "CodigoEmpresa",
            "CodigoFuncionario", "NomeFuncionario", "Cargo", "PIS", "CPF",
            "Setor", "Secao", "FI",
            "SalarioBase", "ReferenciaDias", "Adiantamento", "OutrosDescontos",
            "Banco", "Agencia", "Conta", "Mes", "Ano"
        ];
        
        const row1 = [
            "Empresa Exemplo LTDA", "Av. Brasil, 1000", "00.000.000/0001-00", "101",
            "1", "João da Silva", "Analista de Sistemas", "123.45678.90-0", "111.222.333-44",
            "TI", "Desenvolvimento", "1",
            "3500.00", "30", "1400.00", "0.00",
            "Banco do Brasil", "1234", "56789-0", "Janeiro", "2026"
        ];
        
        const row2 = [
            "Empresa Exemplo LTDA", "Av. Brasil, 1000", "00.000.000/0001-00", "101",
            "2", "Maria Oliveira Santos", "Gerente Financeira", "987.65432.10-0", "555.666.777-88",
            "Financeiro", "Administração", "1",
            "5200.00", "30", "2080.00", "0.00",
            "Itaú", "4321", "98765-4", "Janeiro", "2026"
        ];

        const csvRows = [
            headers.join(','),
            row1.map(v => `"${v}"`).join(','),
            row2.map(v => `"${v}"`).join(',')
        ];

        const csvContent = "\uFEFF" + csvRows.join('\n'); // BOM UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_importacao_holerites.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Faz o parse da planilha carregada (.csv ou .xlsx)
    function parseSpreadsheetFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (!jsonRows || jsonRows.length === 0) {
                    alert("A planilha importada está vazia.");
                    return;
                }

                state.excelEmployees = jsonRows.map(row => {
                    // Função auxiliar para buscar campo sem diferenciar maiúsculas/minúsculas
                    const getField = (...keys) => {
                        for (let k of keys) {
                            const foundKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                            if (foundKey !== undefined && row[foundKey] !== undefined) {
                                return String(row[foundKey]).trim();
                            }
                        }
                        return "";
                    };

                    const parseNum = (...keys) => {
                        const val = getField(...keys);
                        if (!val) return null;
                        const num = parseFloat(val.replace(',', '.'));
                        return Number.isNaN(num) ? null : num;
                    };

                    const month = getField("Mes", "Mês", "Month");
                    const year = getField("Ano", "Year");
                    let monthName = "";
                    if (month && year) monthName = `${month} de ${year}`;
                    else if (month) monthName = month;
                    else if (year) monthName = year;
                    else monthName = state.currentMonth;

                    return {
                        company: {
                            name: getField("RazaoSocial", "Razão Social", "Empresa", "Company"),
                            address: getField("Endereco", "Endereço", "Address"),
                            cnpj: getField("CNPJ"),
                            code: getField("CodigoEmpresa", "Código Empresa", "CompanyCode")
                        },
                        employee: {
                            code: getField("CodigoFuncionario", "Código Funcionário", "Cod", "Código"),
                            name: getField("NomeFuncionario", "Nome Funcionário", "Nome", "Funcionario", "Employee"),
                            role: getField("Cargo", "Role"),
                            pis: getField("PIS"),
                            cpf: getField("CPF"),
                            setor: getField("Setor"),
                            secao: getField("Secao", "Seção"),
                            fi: getField("FI", "F.I.") || "1"
                        },
                        bank: {
                            name: getField("Banco", "Bank"),
                            ag: getField("Agencia", "Agência", "Ag"),
                            cc: getField("Conta", "CC")
                        },
                        financials: {
                            salaryBase: parseNum("SalarioBase", "Salário Base", "Salary"),
                            salaryRef: parseNum("ReferenciaDias", "Referência Dias", "Dias") || 30,
                            advance: parseNum("Adiantamento", "Advance"),
                            customDiscount: parseNum("OutrosDescontos", "Outro Desconto", "Desconto") || 0
                        },
                        taxes: {
                            autoCalc: true,
                            manualInss: null,
                            manualIrrf: null
                        },
                        monthName: monthName
                    };
                });

                // Atualiza elementos da interface
                const count = state.excelEmployees.length;
                elements.excelStatus.textContent = `✓ ${count} funcionário(s) carregado(s) da planilha.`;
                elements.excelStatus.classList.remove('hidden');
                
                elements.btnGenerateExcelText.textContent = `Gerar Holerites da Planilha (${count} Pessoas)`;
                elements.btnGenerateExcelBatch.classList.remove('hidden');
                elements.btnExportExcelZip.classList.remove('hidden');

                // Renderiza o lote imediatamente na visualização!
                generateExcelBatchPages();

            } catch (err) {
                console.error("Erro ao ler planilha:", err);
                alert("Erro ao ler o arquivo de planilha. Certifique-se de que é um arquivo .csv ou .xlsx válido.");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // Renderiza todos os holerites dos funcionários da planilha
    function generateExcelBatchPages() {
        if (!state.excelEmployees || state.excelEmployees.length === 0) {
            alert("Nenhum funcionário carregado da planilha.");
            return;
        }

        elements.pagesContainer.innerHTML = '';

        state.excelEmployees.forEach(empData => {
            const templateContent = elements.pageTemplate.content.cloneNode(true);
            const pageDiv = templateContent.querySelector('.print-page');

            const employerCopy = pageDiv.querySelector('.copy-employer');
            const employeeCopy = pageDiv.querySelector('.copy-employee');

            fillCardFields(employerCopy, empData.monthName, empData);
            fillCardFields(employeeCopy, empData.monthName, empData);

            elements.pagesContainer.appendChild(pageDiv);
        });
    }

    // Função auxiliar para sanitizar nomes de arquivos
    function sanitizeFilename(name) {
        if (!name) return "Sem_Nome";
        return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    }

    // Exporta um PDF único
    function exportSinglePdf() {
        if (typeof html2pdf === 'undefined') {
            alert("A biblioteca de PDF ainda está carregando. Por favor, tente novamente.");
            return;
        }

        const firstPage = elements.pagesContainer.querySelector('.print-page');
        if (!firstPage) {
            alert("Nenhum holerite disponível para gerar PDF.");
            return;
        }

        const empName = state.employee.name || "Funcionario";
        const period = state.currentMonth || "Holerite";
        const fileName = `Holerite_${sanitizeFilename(empName)}_${sanitizeFilename(period)}.pdf`;

        const opt = {
            margin: [4, 4, 4, 4],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(firstPage).save();
    }

    // Exporta PDFs separados para cada funcionário da planilha em um arquivo ZIP
    async function exportBatchSeparatePdfsZip() {
        if (!state.excelEmployees || state.excelEmployees.length === 0) {
            alert("Nenhum funcionário carregado da planilha para exportar.");
            return;
        }

        if (typeof html2pdf === 'undefined' || typeof JSZip === 'undefined') {
            alert("As bibliotecas necessárias para PDF/ZIP ainda estão carregando. Por favor, tente novamente.");
            return;
        }

        const originalBtnText = elements.btnExportExcelZip.innerHTML;
        elements.btnExportExcelZip.disabled = true;
        elements.excelStatus.textContent = `⏳ Gerando PDFs individuais (0/${state.excelEmployees.length})...`;

        const zip = new JSZip();

        try {
            for (let i = 0; i < state.excelEmployees.length; i++) {
                const empData = state.excelEmployees[i];
                elements.excelStatus.textContent = `⏳ Gerando PDF (${i + 1}/${state.excelEmployees.length}): ${empData.employee.name || 'Funcionário'}...`;

                // Renderiza a página individual em um wrapper temporário
                const templateContent = elements.pageTemplate.content.cloneNode(true);
                const pageDiv = templateContent.querySelector('.print-page');

                const employerCopy = pageDiv.querySelector('.copy-employer');
                const employeeCopy = pageDiv.querySelector('.copy-employee');

                fillCardFields(employerCopy, empData.monthName, empData);
                fillCardFields(employeeCopy, empData.monthName, empData);

                // Posiciona a página em container oculto fora da tela para captura
                const tempWrapper = document.createElement('div');
                tempWrapper.style.position = 'absolute';
                tempWrapper.style.left = '-9999px';
                tempWrapper.style.top = '0';
                tempWrapper.appendChild(pageDiv);
                document.body.appendChild(tempWrapper);

                const empName = empData.employee.name || `Funcionario_${i + 1}`;
                const period = empData.monthName || "Holerite";
                const pdfName = `Holerite_${empData.employee.code ? empData.employee.code + '_' : ''}${sanitizeFilename(empName)}_${sanitizeFilename(period)}.pdf`;

                const opt = {
                    margin: [4, 4, 4, 4],
                    filename: pdfName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                // Gera o PDF como Blob
                const pdfBlob = await html2pdf().set(opt).from(pageDiv).output('blob');
                zip.file(pdfName, pdfBlob);

                document.body.removeChild(tempWrapper);
            }

            elements.excelStatus.textContent = `⏳ Empacotando arquivo ZIP final...`;
            const zipContent = await zip.generateAsync({ type: "blob" });

            const zipUrl = URL.createObjectURL(zipContent);
            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = `Holerites_Separados_Planilha.zip`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(zipUrl);

            elements.excelStatus.textContent = `✓ ${state.excelEmployees.length} PDFs individuais exportados com sucesso em arquivo ZIP!`;
        } catch (err) {
            console.error("Erro ao gerar PDFs em lote:", err);
            alert("Ocorreu um erro ao gerar os PDFs individuais. Tente novamente.");
            elements.excelStatus.textContent = `❌ Erro ao exportar PDFs.`;
        } finally {
            elements.btnExportExcelZip.disabled = false;
            elements.btnExportExcelZip.innerHTML = originalBtnText;
        }
    }

    // Configura os ouvidores da planilha e botões de impressão
    elements.btnDownloadTemplate.addEventListener('click', () => {
        downloadCsvTemplate();
    });

    elements.inputExcelFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            parseSpreadsheetFile(file);
        }
    });

    elements.btnGenerateExcelBatch.addEventListener('click', () => {
        generateExcelBatchPages();
        setTimeout(() => {
            window.print();
        }, 300);
    });

    // Certifique-se de que btnExportPdfSingle exista no seu DOM se for usar esta linha
    // Caso contrário, pode ser necessário descomentar ou ajustar conforme o HTML
    /* elements.btnExportPdfSingle.addEventListener('click', () => {
        exportSinglePdf();
    }); */

    elements.btnExportExcelZip.addEventListener('click', () => {
        exportBatchSeparatePdfsZip();
    });

    elements.btnPrintCurrent.addEventListener('click', () => {
        if (!state.selectedMonth || !state.selectedYear) {
            alert('Por favor, selecione o Mês e informe o Ano de Referência antes de imprimir.');
            return;
        }
        updatePreview();
        window.print();
    });

    elements.btnPrintAll.addEventListener('click', () => {
        if (!state.selectedYear) {
            alert('Por favor, informe o Ano de Referência para realizar a impressão em lote de 12 meses.');
            return;
        }
        generateAllMonthsPages();
        // Aguarda um pequeno intervalo para garantir a renderização completa antes de abrir a janela de impressão
        setTimeout(() => {
            window.print();
            // Restaura a visualização do mês único original após o fechamento da janela de impressão
            updatePreview();
        }, 300);
    });

    // Alternador de tema Claro/Escuro
    elements.btnThemeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            elements.btnThemeToggle.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
        } else {
            document.body.setAttribute('data-theme', 'dark');
            elements.btnThemeToggle.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>`;
        }
    });

    // Inicialização
    syncStateToInputs();
    setupInputListeners();
    updatePreview();
});
