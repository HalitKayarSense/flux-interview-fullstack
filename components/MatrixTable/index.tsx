import classnames from 'classnames'
import { useContext, useEffect, useState } from 'react'
import { MatrixTableContext, MatrixTableContextProvider } from './context'

type Props = {
  initialMatrix?: import('../../types').Matrix
} & import('react').HTMLAttributes<HTMLDivElement>

/**
 * Add 4 buttons: 
 * - Cancel to reset the matrix to how it was before changing the values (only when in edit mode)
 * - Edit to make the fields editable (only when not in edit mode)
 * - Clear to completely clear the table
 * - Save to save the table
 * @param param0 
 */
const MatrixTable: import('react').FC<Omit<Props, 'initialMatrix'>> = ({ className, children, ...props }) => {
  // State ------------------------------------------------------------------- //
  const [{ matrix }, dispatch] = useContext(MatrixTableContext)
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [errorNotes, setErrorNotes] = useState("");



  // Handlers ---------------------------------------------------------------- //
  // You can save (to api) the matrix here. Remember to update originalMatrix when done.
  const save = async () => {
    if (!isSaving) {
      setIsSaving(true);
      editToggle(true);
      setIsChanged(false);
      const response = await fetch('/api/save-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matrix),
      })

      const data = await response.json()

      await refreshMatrix(data);

      setIsSaving(false);

    }
  }

  const editToggle = (disableOnly = false) => {
    if (!editMode) {
      setEditMode(true)
      setIsSaving(false);
      setIsChanged(false);
    } else {
      setEditMode(false)
      if (!disableOnly)
        dispatch({
          type: 'SET_MATRIX',
          metadata: {
            resetToEmpty: false
          }
        })
    }

  }

  //clear current matrix to zero
  const clear = () => {
    dispatch({
      type: 'SET_MATRIX',
      metadata: {
        resetToEmpty: true
      }
    })
    setIsChanged(true);
  }

  //validate if the value is digit only and max 1 dot
  const isValidInput = (value) => {
    let valid = value.match(/^[0-9]*\.?[0-9]*$/);
    setErrorNotes(valid ? "" : "You can't enter letters & symbols, or more then 1 dot")

    return valid
  }


  //called each time something is typed in the cells
  const setTyping = (PackagePrice, Tier, Value, onBlur = false) => {


    if (isValidInput(Value)) {

      //if the input is empty string, make it zero
      if (Value == "") {
        Value = "0";
      }

      setIsChanged(true);

      //if user finished entering input, the value will be parsed to float, otherwise it will maintain restricted string
      if(onBlur){
        Value = parseFloat(Value);
      }

      //update the cell value
      dispatch({
        type: 'SET_MATRIX_CELL',
        payload: {
          PackagePrice,
          Tier,
          Value
        }
      })

      //if is 'lite' then update other tiers who get effected by multiplying 2 and 3
      if (Tier == "lite") {

        //convert the input to float to do the math
        Value = parseFloat(Value);

        dispatch({
          type: 'SET_MATRIX_CELL',
          payload: {
            PackagePrice,
            Tier: 'standard',
            Value: Value * 2
          }
        })

        dispatch({
          type: 'SET_MATRIX_CELL',
          payload: {
            PackagePrice,
            Tier: 'unlimited',
            Value: Value * 3
          }
        })
      }
    }


  }

  // Effects ----------------------------------------------------------------- //

  const fetchMatrix = async () => {
    try {
      const response = await fetch('/api/pricing')
      const data = await response.json()
      refreshMatrix(data);

    } catch (e) {
      console.log("NO DATA FOUND")
    }

  }

  const refreshMatrix = (data) => {
    dispatch({
      type: 'SET_ORIGINAL_MATRIX',
      payload: data
    })
    dispatch({
      type: 'SET_MATRIX',
      payload: data,
      metadata: {
        resetToEmpty: false
      }
    })
  }

  useEffect(() => {
    fetchMatrix();
  }, []);

  // Rendering --------------------------------------------------------------- //
  return (
    <div className={classnames(['container', className])} {...props}>
      <button onClick={save} disabled={isSaving || (!isChanged && editMode) || !editMode}>Save</button>
      <button onClick={() => editToggle()}>{!editMode ? "Edit" : "Cancel"}</button>
      <button onClick={clear} disabled={isSaving || !editMode}>Clear</button>
      <br />
      <br />



      <table>
        <thead key={'head'}>
          <tr>
            <th></th>
            <th>lite</th>
            <th>standard</th>
            <th>unlimited</th>
          </tr>
        </thead>

        {Object.keys(matrix).map((row, i) => (
          <tbody key={i} >
            <tr >
              <td key={i + "name"} >
                {row}
              </td>
              {Object.keys(matrix[row]).map((colomn, j) => (
                <td key={i + "-" + j}>
                  <input
                    className='inputCell'
                    value={matrix[row][colomn]}
                    onChange={(e) => setTyping(row, colomn, e.target.value)} 
                    onBlur={(e) => setTyping(row, colomn, e.target.value, true)}
                    disabled={!editMode} />
                </td>
              ))}
            </tr>
          </tbody>

        ))}

      </table>
      <div className='notes'>{!editMode ? "" : "Edit the values in the cells"}</div>
      <div className='errorNotes'>{errorNotes}</div>

      <style jsx>{`
        .container {
          
        }

        table, th, td {
          border-collapse: collapse;
          border: 1px solid;
        }

        .inputCell {
          text-align: center;
          background: none;
          width: 100%;
          height: 100%;
          border:none;
          outline:none;
        }

        .inputCell:focus {
          background:  #ADD8E6;
        }

        .inputCell:disabled {
          background: lightgray;
        }

        .notes{
          font-size: 12px;
          color: blue;
        }

        .errorNotes{
          font-size: 12px;
          color: red;
        }
      `}</style>
    </div >
  )
}



const MatrixTableWithContext: import('react').FC<Props> = ({ initialMatrix, ...props }) => {
  // You can fetch the pricing here or in pages/index.ts
  // Remember that you should try to reflect the state of pricing in originalMatrix.
  // matrix will hold the latest value (edited or same as originalMatrix)

  return (
    <MatrixTableContextProvider initialMatrix={initialMatrix}>
      <MatrixTable {...props} />
    </MatrixTableContextProvider>
  )
}

export default MatrixTableWithContext
